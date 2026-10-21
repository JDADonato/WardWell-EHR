// WardWell EHR - Canvas Signature Pad Component
export class SignaturePad {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.options = {
      penColor: options.penColor || '#0f1015',
      lineWidth: options.lineWidth || 2,
      ...options
    };

    this.isDrawing = false;
    this.points = [];
    this.history = [];
    this.isEmpty = true;

    this.resizeCanvas();
    this.bindEvents();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width = rect.width * ratio;
      this.canvas.height = rect.height * ratio;
      this.ctx.scale(ratio, ratio);
      this.redraw();
    }
  }

  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.points = [pos];
      this.isEmpty = false;
    };

    const moveDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.points.push(pos);
      this.drawStroke(this.points);
    };

    const endDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      if (this.points.length > 0) {
        this.history.push([...this.points]);
        this.points = [];
      }
    };

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    this.canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw, { passive: false });
  }

  drawStroke(points) {
    if (points.length < 2) return;
    this.ctx.strokeStyle = this.getPenColor();
    this.ctx.lineWidth = this.options.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    this.ctx.stroke();
  }

  getPenColor() {
    return '#0f1015';
  }

  redraw() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.strokeStyle = this.getPenColor();
    this.ctx.lineWidth = this.options.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const stroke of this.history) {
      if (stroke.length < 2) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        this.ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      this.ctx.stroke();
    }
  }

  undo() {
    if (this.history.length > 0) {
      this.history.pop();
      this.redraw();
      this.isEmpty = this.history.length === 0;
    }
  }

  clear() {
    this.history = [];
    this.points = [];
    this.isEmpty = true;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  toDataURL() {
    if (this.isEmpty || this.history.length === 0) return null;
    return this.canvas.toDataURL('image/png');
  }

  fromDataURL(dataUrl) {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.isEmpty = false;
    };
    img.src = dataUrl;
  }
}
