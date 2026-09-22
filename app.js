// ============================================================
// 짤팩토리 - 텍스트 옵션(크기/색상) 실시간 조절 & PNG 다운로드
// ============================================================

// --- DOM 참조 ---
const imageInput   = document.getElementById('imageInput');
const topTextInput = document.getElementById('topText');
const botTextInput = document.getElementById('bottomText');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontColorInput = document.getElementById('fontColor');
const downloadBtn  = document.getElementById('downloadBtn');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');

// --- 상태 ---
let bgImage = null;   // 업로드된 배경 이미지 (Image 객체)

// ============================================================
// 렌더링
// ============================================================
function render() {
  const w = canvas.width;
  const h = canvas.height;

  // 배경 초기화 (체커보드 느낌의 회색)
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#e9ecf1';
  ctx.fillRect(0, 0, w, h);

  // 배경 이미지 그리기 (있을 경우, 비율 유지 cover 스타일)
  if (bgImage) {
    drawImageCover(bgImage, 0, 0, w, h);
  }

  // 텍스트 스타일
  const fontSize = parseInt(fontSizeInput.value, 10);
  const fontColor = fontColorInput.value;
  ctx.font = `bold ${fontSize}px 'Malgun Gothic', sans-serif`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 가독성을 위한 외곽선
  ctx.lineWidth = Math.max(2, fontSize / 12);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineJoin = 'round';

  const padding = fontSize * 0.7;

  // 상단 텍스트
  const topText = topTextInput.value.trim();
  if (topText) {
    const y = padding;
    wrapText(topText, w / 2, y, w - padding * 2, fontSize * 1.15, 'top');
  }

  // 하단 텍스트
  const botText = botTextInput.value.trim();
  if (botText) {
    const y = h - padding;
    wrapText(botText, w / 2, y, w - padding * 2, fontSize * 1.15, 'bottom');
  }

  // 다운로드 버튼 활성화 여부 (이미지 or 텍스트 중 하나라도 있으면)
  downloadBtn.disabled = !bgImage && !topText && !botText;
}

// ============================================================
// 이미지를 cover 방식으로 그리기 (비율 유지, 잘라서 채움)
// ============================================================
function drawImageCover(img, dx, dy, dWidth, dHeight) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const imgRatio = iw / ih;
  const boxRatio = dWidth / dHeight;

  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    // 이미지가 더 넓음 → 좌우를 잘라냄
    sh = ih;
    sw = ih * boxRatio;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    // 이미지가 더 높음 → 상하를 잘라냄
    sw = iw;
    sh = iw / boxRatio;
    sx = 0;
    sy = (ih - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dWidth, dHeight);
}

// ============================================================
// 텍스트 줄바꿈 (공백 기준) + 외곽선 포함 그리기
// anchor: 'top' | 'bottom' | 'middle'
// ============================================================
function wrapText(text, cx, cy, maxWidth, lineHeight, anchor) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // anchor에 따라 첫 줄의 y 위치 결정
  let startY;
  if (anchor === 'top') {
    startY = cy;
  } else if (anchor === 'bottom') {
    startY = cy - (lines.length - 1) * lineHeight;
  } else {
    startY = cy - ((lines.length - 1) * lineHeight) / 2;
  }

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    ctx.strokeText(line, cx, y);
    ctx.fillText(line, cx, y);
  });
}

// ============================================================
// 이벤트 바인딩
// ============================================================

// C06: 이미지 업로드 → Canvas 렌더링
imageInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;

      // 이미지 비율에 맞춰 캔버스 크기 조정 (최대 800px 기준)
      const maxW = 800;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.min(1, maxW / iw);

      canvas.width  = Math.round(iw * scale);
      canvas.height = Math.round(ih * scale);

      render();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// C07: 텍스트 입력 → 실시간 렌더링
topTextInput.addEventListener('input', render);
botTextInput.addEventListener('input', render);

// C08: 글자 크기 슬라이더 → 실시간 렌더링 + 값 표시
fontSizeInput.addEventListener('input', () => {
  fontSizeValue.textContent = fontSizeInput.value;
  render();
});

// C09: 글자 색상 → 실시간 렌더링
fontColorInput.addEventListener('input', render);

// C10: PNG 다운로드
downloadBtn.addEventListener('click', () => {
  // 캔버스를 PNG 데이터 URL로 변환
  const dataURL = canvas.toDataURL('image/png');

  // 파일명: jjal_YYYYMMDD_HHMMSS.png
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const filename =
    `jjal_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// ============================================================
// 초기 렌더
// ============================================================
render();