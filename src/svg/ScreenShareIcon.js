import React from "react";

export default function ScreenShareIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      height={24}
      width={24}
      preserveAspectRatio="xMidYMid meet"
      version="1.1"
      x="0px"
      y="0px"
      enableBackground="new 0 0 24 24"
      xmlSpace="preserve"
    >
      <path
        className={className}
        enableBackground="new"
        d="M3 4c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-5v2h2v2H8v-2h2v-2H5c-1.1 0-2-.9-2-2V4zm2 0v12h14V4H5zm12 8h-4v2h4v-2zm-6-4h8V6h-8v2zm0 2h6v-2h-6v2z"
      />
    </svg>
  );
}
