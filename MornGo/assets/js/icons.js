const XLINK_NS = 'http://www.w3.org/1999/xlink';
function injectIcon(el, name, size = 24) {
  if (!el) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ui-icon');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS(XLINK_NS, 'xlink:href', `assets/icons/icons.svg#${name}`);
  use.setAttribute('href', `assets/icons/icons.svg#${name}`);
  svg.appendChild(use);
  el.innerHTML = '';
  el.appendChild(svg);
}

function injectAllIcons(root = document) {
  const slots = root.querySelectorAll('.icon-slot[data-icon]');
  slots.forEach(slot => {
    const name = slot.getAttribute('data-icon');
    const sizeAttr = slot.getAttribute('data-size');
    const size = sizeAttr ? parseInt(sizeAttr) : 24;
    injectIcon(slot, name, size);
  });
}

export { injectIcon, injectAllIcons };
