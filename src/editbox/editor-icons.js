function copyEditorIconProperties(target, source) {
  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
}

export function normalizeEditorIconDescriptor(icon) {
  var normalized;
  if (icon === false || icon == null) {
    return null;
  }
  if (typeof icon === 'function') {
    icon = { onClick: icon };
  } else if (typeof icon === 'string') {
    icon = { iconCls: icon };
  }
  if (typeof icon !== 'object') {
    return null;
  }
  normalized = copyEditorIconProperties({}, icon);
  normalized.iconCls = icon.iconCls || icon.className || icon.iconClass || icon.icon || '';
  normalized.ariaLabel = icon.ariaLabel || icon.label || icon.title || '';
  normalized.onClick = icon.onClick || icon.click || icon.handler || null;
  normalized.align = String(icon.align || '').toLowerCase() === 'left' ? 'left' : 'right';
  return normalized;
}

export function normalizeEditorIconDescriptors(icons) {
  var normalized = [];
  var descriptor;
  var index;
  if (!icons) {
    return normalized;
  }
  if (!Array.isArray(icons)) {
    icons = [icons];
  }
  for (index = 0; index < icons.length; index += 1) {
    descriptor = normalizeEditorIconDescriptor(icons[index]);
    if (descriptor) {
      normalized.push(descriptor);
    }
  }
  return normalized;
}
