---
title: ArcMap 웹서버 DMZ 배치 테스트
---
// Excalidraw Script Engine: YAML 아래는 실행 코드만 둡니다.
const notice = (message) => new ea.obsidian.Notice(message, 7000);
const LIBRARY = "Excalidraw/Libraries/local-library.excalidrawlib";
const ITEM_ID = "L-5apBcsCZmLyXEcM2c_h";
const SERVER_NAME = "web_007";
try {
  if (!ea.targetView || !ea.verifyMinimumPluginVersion("2.29.0")) {
    throw new Error("Excalidraw 2.29.0 이상에서 테스트 Drawing을 열어주세요.");
  }
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
  const width = Math.max(box.width, label.width);
  const height = box.height + 16 + label.height;
  const pad = 32;
  const topReserve = 72;
  if (zone.width < width + pad * 2 || zone.height < height + topReserve + pad) {
    throw new Error(`DMZ가 작습니다. 최소 ${Math.ceil(width + pad*2)} × ${Math.ceil(height + topReserve + pad)} 크기로 늘려주세요.`);
  }
  const left = zone.x + (zone.width - width) / 2;
  const top = zone.y + topReserve;
  // 첫 POC는 기존 객체와 겹치면 이동시키지 않고 중단합니다.
  const overlaps = scene.some(e => {
    if (e.id === zone.id || e.containerId === zone.id) return false;
    const b = ea.getBoundingBox([e]);
    return b.topX < left + width + 8 && b.topX + b.width > left - 8 &&
      b.topY < top + height + 8 && b.topY + b.height > top - 8;
  });
  if (overlaps) throw new Error("배치할 위치에 기존 요소가 있습니다. 빈 DMZ에서 먼저 테스트해주세요.");
  const dx = left + (width - box.width) / 2 - box.topX;
  const dy = top - box.topY;
  for (const element of elements) {
    element.x += dx;
    element.y += dy;
    ea.elementsDict[element.id] = element;
  }
  label.x = left + (width - label.width) / 2;
  label.y = top + box.height + 16;
  label.customData = {arcmapPoc: {serverName: SERVER_NAME, zoneElementId: zone.id, status: "draft"}};
  const ids = [...elements.map(e => e.id), labelId];
  ea.addToGroup(ids);
  const added = await ea.addElementsToView(false, true, true);
  if (!added) throw new Error("Drawing에 요소를 추가하지 못했습니다.");
  ea.selectElementsInView(ids);
  notice("web_007 배치 완료. 선택 영역 확대는 Shift+2, 실행 취소는 Cmd+Z입니다.");
} catch (error) {
  notice(`ArcMap: ${error.message || error}`);
}
