import React from "react";
import Icon from "./Icons";
import { resolveMediaUrl } from "../lib/api";

const ImageLightbox = ({ open, src, alt = "Issue image", onClose }) => {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const panStartRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [open, src]);

  React.useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [zoom]);

  React.useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const nextX = panStartRef.current.x + (e.clientX - dragStartRef.current.x);
      const nextY = panStartRef.current.y + (e.clientY - dragStartRef.current.y);
      setPan({ x: nextX, y: nextY });
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
      if (e.key === "-") setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !src) return null;

  const imageUrl = resolveMediaUrl(src);

  const startDrag = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    setDragging(true);
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={onClose}>
      <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lightbox-btn" onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}>
          <Icon name="arrowLeft" size={14} />
          Zoom out
        </button>
        <span className="lightbox-zoom">{Math.round(zoom * 100)}%</span>
        <button type="button" className="lightbox-btn" onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}>
          <Icon name="arrowRight" size={14} />
          Zoom in
        </button>
        <button type="button" className="lightbox-btn" onClick={() => setZoom(1)}>Reset</button>
        <button type="button" className="lightbox-btn close" onClick={onClose}>
          <Icon name="x" size={14} />
          Close
        </button>
      </div>

      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={alt}
          className={`lightbox-image ${zoom > 1 ? "zoomed" : ""} ${dragging ? "dragging" : ""}`}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          onMouseDown={startDrag}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
