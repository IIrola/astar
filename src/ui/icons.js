const paths = {
  back: '<path d="m10 6-6 6 6 6m10-12-6 6 6 6"/>',
  step: '<path d="m5 5 10 7-10 7ZM20 5v14"/>',
  play: '<path d="m7 4 13 8-13 8Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  new: '<path d="M7 5h12v12M19 5 5 19"/>',
};

export const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${paths[name]}</svg>`;
