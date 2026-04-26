// src/components/Primitives.jsx
import React from "react";
import Icon from "./Icons";

export const Button = ({ variant = "primary", size = "md", children, icon, iconRight, className = "", ...rest }) => {
  const variants = { primary: "", ghost: "ghost", lime: "solid-lime" };
  const sizes = { sm: "sm", md: "", lg: "lg" };
  return (
    <button className={`btn ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} className="arrow" />}
    </button>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    "Pending":     { cls: "pending", pulse: true },
    "In Progress": { cls: "progress", pulse: true },
    "Resolved":    { cls: "resolved", pulse: false },
    "Rejected":    { cls: "rejected", pulse: false },
  };
  const s = map[status] || map.Pending;
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`dot ${s.pulse ? "pulse" : ""}`}></span>
      {status}
    </span>
  );
};

export const CategoryPill = ({ category }) => {
  const cls = (category || "other").toLowerCase();
  return (
    <span className={`cat ${cls}`}>
      <span className="dot"></span>
      {category}
    </span>
  );
};

export const categoryIcon = (cat) => {
  const map = { Garbage: "garbage", Water: "water", Electricity: "bolt", Road: "road", Other: "sparkle" };
  return map[cat] || "sparkle";
};

export const categoryColor = (cat) => {
  const map = {
    Garbage:     { bg: "rgba(245,158,11,0.12)",  fg: "#F59E0B", bd: "rgba(245,158,11,0.3)" },
    Water:       { bg: "rgba(56,189,248,0.12)",  fg: "#38BDF8", bd: "rgba(56,189,248,0.3)" },
    Electricity: { bg: "rgba(201,242,62,0.12)",  fg: "#C9F23E", bd: "rgba(201,242,62,0.3)" },
    Road:        { bg: "rgba(167,139,250,0.12)", fg: "#A78BFA", bd: "rgba(167,139,250,0.3)" },
    Other:       { bg: "rgba(244,114,182,0.12)", fg: "#F472B6", bd: "rgba(244,114,182,0.3)" },
  };
  return map[cat] || map.Other;
};
