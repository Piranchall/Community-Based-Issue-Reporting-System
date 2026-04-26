// src/components/IssueCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icons";
import { CategoryPill, StatusBadge } from "./Primitives";
import { resolveMediaUrl } from "../lib/api";
import ImageLightbox from "./ImageLightbox";

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text, query) => {
  if (!text) return "";
  const q = query?.trim();
  if (!q) return text;
  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = String(text).split(re);
  return parts.map((part, idx) => (
    idx % 2 === 1
      ? <mark key={idx} className="text-highlight">{part}</mark>
      : <React.Fragment key={idx}>{part}</React.Fragment>
  ));
};

const IssueCard = ({ issue, onOpen, onUpvote, compact = false, searchTerm = "" }) => {
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const stop = (e) => e.stopPropagation();
  const hasImage = Boolean(issue.image);
  const upvoteCount = issue.upvoteCount ?? issue._count?.upvotes ?? 0;
  const commentCount = issue.commentCount ?? issue._count?.comments ?? (Array.isArray(issue.comments) ? issue.comments.length : 0);
  const address = issue.address || `${issue.latitude?.toFixed?.(4)}, ${issue.longitude?.toFixed?.(4)}`;

  return (
    <div className={`issue-card card ${hasImage ? "" : "no-photo"}`.trim()} onClick={() => onOpen?.(issue)}>
      {hasImage && (
        <div className="issue-thumb">
          <img
            src={resolveMediaUrl(issue.image)}
            alt="Issue"
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
          />
        </div>
      )}

      <div className="issue-body">
        <div className="issue-top">
          <CategoryPill category={issue.category} />
          <StatusBadge status={issue.status} />
        </div>
        <div className="issue-title">{highlightText(issue.title, searchTerm)}</div>
        {!compact && <div className="issue-desc">{highlightText(issue.description, searchTerm)}</div>}
        <div className="issue-meta">
          <span className="m-item"><Icon name="pin" />{highlightText(address, searchTerm)}</span>
          <span className="m-item"><Icon name="clock" />{issue.timeAgo || new Date(issue.createdAt).toLocaleDateString()}</span>
          {issue.user?.id && (
            <button
              type="button"
              className="meta-link"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/users/${issue.user.id}`);
              }}
            >
              <Icon name="user" />
              {highlightText((`${issue.user.firstName || ""} ${issue.user.lastName || ""}`.trim() || "Reporter"), searchTerm)}
            </button>
          )}
          <span className="m-item"><Icon name="msg" />{commentCount}</span>
        </div>
      </div>

      <div className="issue-actions" onClick={stop}>
        <button className={`upvote-btn ${issue.hasUpvoted ? "active" : ""}`}
          onClick={() => onUpvote?.(issue)}>
          <Icon name="arrowUp" size={16} />
          <span className="ucount">{upvoteCount}</span>
          <span className="ulabel">UP</span>
        </button>
      </div>

      <ImageLightbox
        open={lightboxOpen}
        src={issue.image}
        alt={issue.title || "Issue image"}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default IssueCard;
