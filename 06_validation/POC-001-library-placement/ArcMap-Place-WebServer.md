---
title: ArcMap 웹서버 DMZ 배치 테스트
---
// Excalidraw Script Engine: YAML 아래는 실행 코드만 둡니다.
// ARCMAP_NAME_SYNC_BEGIN
function installArcMapNameSync(view, notify) {
  const api = view.excalidrawAPI;
  if (!api?.onChange || !view.updateScene) throw new Error("서버명 동기화 API를 사용할 수 없습니다.");
  const key = "__arcmapNameSyncV1";
  if (view[key]?.api === api) { view[key].flush(); return view[key]; }
  view[key]?.stop();
  let timer = null, busy = false, stopped = false, lastWarning = "";
  function flush() {
    if (stopped || busy || api.getAppState()?.editingTextElement) return;
    const scene = api.getSceneElements();
    const live = scene.filter(e => !e.isDeleted);
    const labels = live.filter(e => e.type === "text" && e.customData?.arcmapPoc &&
      (e.customData.arcmapPoc.role === "server-name" ||
       (!e.customData.arcmapPoc.libraryItemId && typeof e.customData.arcmapPoc.serverName === "string")));
    const instances = labels.map(label => {
      const name = String(label.originalText ?? label.text ?? "").split(/\r?\n/)[0].trim();
      const group = label.groupIds?.[label.groupIds.length - 1];
      const members = live.filter(e => e.id === label.id || (group && e.groupIds?.includes(group) &&
        e.customData?.arcmapPoc && e.customData.arcmapPoc.role !== "server-name" &&
        e.customData.arcmapPoc.zoneElementId === label.customData.arcmapPoc.zoneElementId));
      return {label, name, members};
    });
    const counts = new Map();
    for (const {name} of instances) if (name) counts.set(name, (counts.get(name) || 0) + 1);
    const changes = new Map();
    const warnings = new Set();
    for (const {label, name, members} of instances) {
      const conflict = !!name && counts.get(name) > 1;
      if (!name) warnings.add("서버명이 비어 있습니다");
      if (conflict) warnings.add(`서버명 중복: ${name}`);
      for (const e of members) {
        const old = e.customData.arcmapPoc;
        const next = {...old, serverName: name, serverId: label.id, nameLabelId: label.id,
          nameConflict: conflict, invalidName: !name, ...(e.id === label.id ? {role: "server-name"} : {})};
        if (JSON.stringify(old) === JSON.stringify(next)) continue;
        changes.set(e.id, {...e, customData: {...e.customData, arcmapPoc: next},
          version: (e.version || 0) + 1, versionNonce: Math.floor(Math.random() * 2147483647), updated: Date.now()});
      }
    }
    const warning = [...warnings].sort().join(" / ");
    if (warning && warning !== lastWarning) notify(`ArcMap: ${warning}. 서버명 라벨을 수정해주세요.`);
    lastWarning = warning;
    if (!changes.size) return;
    busy = true;
    try {
      // Metadata follows the user's text edit and does not create a separate undo step.
      view.updateScene({elements: scene.map(e => changes.get(e.id) || e), captureUpdate: "NEVER"});
      view.setDirty();
    } finally { busy = false; }
  }
  const unsubscribe = api.onChange(() => {
    if (busy || stopped) return;
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; flush(); }, 80);
  });
  const controller = {api, flush, stop() {stopped = true; clearTimeout(timer); unsubscribe();}};
  view[key] = controller;
  // Obsidian's view owns the subscription and releases it when the Drawing closes.
  view.register(() => {controller.stop(); if (view[key] === controller) delete view[key];});
  flush();
  return controller;
}
// ARCMAP_NAME_SYNC_END

const notice = (message) => new ea.obsidian.Notice(message, 7000);
const LIBRARY = "Excalidraw/Libraries/local-library.excalidrawlib";
const ITEM_ID = "L-5apBcsCZmLyXEcM2c_h";
const SERVER_NAME = "web_007";
try {
  if (!ea.targetView || !ea.verifyMinimumPluginVersion("2.29.0")) {
    throw new Error("Excalidraw 2.29.0 이상에서 테스트 Drawing을 열어주세요.");
  }
  installArcMapNameSync(ea.targetView, notice);
  const selected = ea.getViewSelectedElements();
  const rectangles = selected.filter(e => e.type === "rectangle" && !e.isDeleted);
  if (rectangles.length !== 1 || selected.some(e => !["rectangle", "text"].includes(e.type))) {
    throw new Error("DMZ로 사용할 사각형 하나만 선택해주세요. 연결된 제목 텍스트는 함께 선택되어도 됩니다.");
  }
  const zone = rectangles[0];
  if (Math.abs(zone.angle || 0) > 0.00001 || zone.locked) {
    throw new Error("회전하지 않은 잠금 해제된 DMZ 사각형을 선택해주세요.");
  }
  const scene = ea.getViewElements().filter(e => !e.isDeleted);
  if (scene.some(e => e.customData?.arcmapPoc?.serverName === SERVER_NAME)) {
    throw new Error("이 Drawing에 web_007 테스트 객체가 이미 있습니다. 실행 취소 또는 삭제 후 다시 시도하세요.");
  }
  const raw = await ea.targetView.app.vault.adapter.read(LIBRARY);
  const library = JSON.parse(raw);
  const item = library.libraryItems?.find(i => i.id === ITEM_ID);
  if (!item) throw new Error("라이브러리에서 지정한 Web 항목을 찾지 못했습니다.");
  const originals = item.elements.filter(e => !e.isDeleted);
  if (!originals.length || originals.some(e => !["rectangle", "line", "text"].includes(e.type))) {
    throw new Error("Web 항목의 구성이 변경되었습니다. 스크립트를 다시 확인해주세요.");
  }
  ea.reset();
  const idMap = new Map(originals.map(e => [e.id, ea.generateElementId()]));
  const groups = new Map();
  const remap = id => idMap.get(id) || null;
  const elements = JSON.parse(JSON.stringify(originals));
  for (const element of elements) {
    element.id = idMap.get(element.id);
    element.groupIds = (element.groupIds || []).map(id => {
      if (!groups.has(id)) groups.set(id, ea.generateElementId());
      return groups.get(id);
    });
    element.containerId = remap(element.containerId);
    element.frameId = null;
    element.boundElements = (element.boundElements || []).filter(b => idMap.has(b.id))
      .map(b => ({...b, id: remap(b.id)}));
    for (const key of ["startBinding", "endBinding"]) {
      if (element[key]) element[key] = idMap.has(element[key].elementId)
        ? {...element[key], elementId: remap(element[key].elementId)} : null;
    }
    delete element.index;
    element.version = 1;
    element.versionNonce = Math.floor(Math.random() * 2147483647);
    element.updated = Date.now();
    element.isDeleted = false;
    element.locked = false;
    element.customData = {...element.customData, arcmapPoc: {
      serverName: SERVER_NAME, zoneElementId: zone.id, libraryItemId: ITEM_ID, status: "draft"
    }};
  }
  const box = ea.getBoundingBox(elements);
  ea.style.fontSize = 18;
  ea.style.strokeColor = "#1b1b1f";
  ea.style.fontFamily = originals.find(e => e.type === "text")?.fontFamily || 1;
  const labelId = ea.addText(0, box.height + 16, "web_007\n10.0.0.250", {textAlign: "center"});
  const label = ea.getElement(labelId);
  const baseWidth = Math.max(box.width, label.width);
  const baseHeight = box.height + 16 + label.height;
  const bounds = es => ea.getBoundingBox(es);
  const inside = b => b.topX >= zone.x && b.topY >= zone.y &&
    b.topX + b.width <= zone.x + zone.width && b.topY + b.height <= zone.y + zone.height;
  // Prefer server metadata; also recognize unmodified library groups by their structure.
  const candidates = new Map();
  for (const e of scene) {
    const meta = e.customData?.arcmapPoc;
    if (meta?.libraryItemId === ITEM_ID && meta.serverName) {
      const key = `server:${meta.serverName}`;
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push(e);
    }
    for (const group of e.groupIds || []) {
      const key = `group:${group}`;
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push(e);
    }
  }
  const signature = es => es.map(e => e.type + (e.type === "text" ? `:${e.text}` : "")).sort().join("|");
  const sourceSignature = signature(originals);
  const sourceBody = bounds(originals.filter(e => e.type !== "text"));
  const ratios = [];
  const seen = new Set();
  for (const [key, es] of candidates) {
    const knownWeb = key.startsWith("server:") || signature(es) === sourceSignature;
    // Other server symbols can have different geometry and captions (e.g. "Server").
    const namedServer = es.some(e => e.type === "text" &&
      /(?:server|서버|^web$|^was$|^db$)/i.test(e.text || "")) &&
      es.some(e => e.type !== "text") && !es.some(e => e.id === zone.id);
    if (!knownWeb && !namedServer) continue;
    const identity = es.map(e => e.id).sort().join("|");
    if (seen.has(identity)) continue;
    seen.add(identity);
    // Compare the bodies, excluding captions and the IP/name labels.
    const body = es.filter(e => e.type !== "text");
    if (!body.length || !inside(bounds(es))) continue;
    const b = bounds(body);
    if (inside(b) && b.width > 0 && box.width > 0) ratios.push(b.width / sourceBody.width);
  }
  ratios.sort((a, b) => a - b);
  const preferredScale = ratios.length ? ratios[Math.floor(ratios.length / 2)] : 1;
  // Reserve proportional margins so small zones remain usable.
  const pad = Math.min(32, zone.width * 0.05, zone.height * 0.05);
  const topReserve = Math.min(72, zone.height * 0.18);
  const area = {x: zone.x + pad, y: zone.y + topReserve,
    width: zone.width - 2 * pad, height: zone.height - topReserve - pad};
  if (area.width <= 0 || area.height <= 0 || baseWidth <= 0 || baseHeight <= 0) {
    throw new Error("DMZ와 라이브러리의 크기는 0보다 커야 합니다.");
  }
  const obstacles = scene.filter(e => e.id !== zone.id).map(e => bounds([e]));
  let placement = null;
  let scale = Math.min(preferredScale, area.width / baseWidth, area.height / baseHeight);
  // Candidate positions along obstacle edges find available gaps without moving existing objects.
  for (let attempt = 0; attempt < 100 && !placement; attempt++, scale *= 0.9) {
    const width = baseWidth * scale, height = baseHeight * scale;
    const gap = Math.min(8, 8 * scale);
    const xs = [area.x, area.x + (area.width - width) / 2];
    const ys = [area.y];
    for (const b of obstacles) {
      xs.push(b.topX + b.width + gap, b.topX - width - gap);
      ys.push(b.topY + b.height + gap, b.topY - height - gap);
    }
    for (const top of ys.sort((a,b) => a-b)) {
      for (const left of xs.sort((a,b) => a-b)) {
        if (left < area.x || top < area.y || left + width > area.x + area.width + 1e-8 ||
            top + height > area.y + area.height + 1e-8) continue;
        if (obstacles.some(b => b.topX < left + width + gap && b.topX + b.width > left - gap &&
            b.topY < top + height + gap && b.topY + b.height > top - gap)) continue;
        placement = {left, top, scale};
        break;
      }
      if (placement) break;
    }
  }
  if (!placement) throw new Error("DMZ에 빈 공간이 없습니다. 기존 객체를 이동하거나 영역을 넓혀주세요.");
  const {left, top} = placement;
  scale = placement.scale;
  // Uniformly scale coordinates, line points and text as one reusable symbol.
  for (const element of elements) {
    element.x = left + ((baseWidth - box.width) / 2 + element.x - box.topX) * scale;
    element.y = top + (element.y - box.topY) * scale;
    element.width *= scale;
    element.height *= scale;
    if (element.points) element.points = element.points.map(([x,y]) => [x * scale, y * scale]);
    if (element.fontSize) element.fontSize *= scale;
    if (element.strokeWidth) element.strokeWidth *= scale;
    // Bounds calculation may cache line paths. Invalidate geometry after resizing.
    element.version += 1;
    element.versionNonce = Math.floor(Math.random() * 2147483647);
    element.updated = Date.now();
    ea.elementsDict[element.id] = JSON.parse(JSON.stringify(element));
  }
  label.x = left + (baseWidth - label.width) * scale / 2;
  label.y = top + (box.height + 16) * scale;
  label.width *= scale;
  label.height *= scale;
  if (label.fontSize) label.fontSize *= scale;
  label.customData = {arcmapPoc: {serverName: SERVER_NAME, zoneElementId: zone.id, status: "draft"}};
  const ids = [...elements.map(e => e.id), labelId];
  for (const id of ids) {
    const element = ea.elementsDict[id];
    element.customData.arcmapPoc = {...element.customData.arcmapPoc,
      serverId: labelId, nameLabelId: labelId, ...(id === labelId ? {role: "server-name"} : {})};
  }
  ea.addToGroup(ids);
  const added = await ea.addElementsToView(false, true, true);
  if (!added) throw new Error("Drawing에 요소를 추가하지 못했습니다.");
  ea.selectElementsInView(ids);
  notice(`web_007 배치 완료 (원본 대비 ${Math.round(scale * 100)}%).${ratios.length && scale < preferredScale - 0.001 ? " 빈 공간에 맞추기 위해 기존 서버보다 작게 배치했습니다." : ""} 선택 영역 확대: Shift+2, 실행 취소: Cmd+Z`);
} catch (error) {
  notice(`ArcMap: ${error.message || error}`);
}
