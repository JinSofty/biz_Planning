---
title: ArcMap 서버명 자동 동기화
---
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

try {
  const notice = message => new ea.obsidian.Notice(message, 7000);
  if (!ea.targetView || !ea.verifyMinimumPluginVersion("2.29.0")) throw new Error("Excalidraw Drawing을 열어주세요.");
  installArcMapNameSync(ea.targetView, notice);
  if (utils.executionSource !== "view-autostart") {
    const permission = await ea.registerAutostart("서버명 라벨 편집 후 내부 서버명과 중복 상태를 자동으로 동기화합니다. 그림·라벨 내용은 바꾸지 않습니다.");
    notice(permission === "allow" ? "서버명 자동 동기화 활성화. Drawing을 다시 열어도 적용됩니다." : "현재 Drawing의 서버명 동기화 활성화. 다음에 열 때는 이 스크립트를 다시 실행해주세요.");
  }
} catch (error) {new ea.obsidian.Notice(`ArcMap: ${error.message || error}`, 7000);}
