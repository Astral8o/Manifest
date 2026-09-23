/* @ds-bundle: {"format":4,"namespace":"EventoryDesignSystem_d28b5d","components":[{"name":"CategoryTile","sourcePath":"components/catalog/CategoryTile.jsx"},{"name":"NumberedStep","sourcePath":"components/catalog/NumberedStep.jsx"},{"name":"ProductRow","sourcePath":"components/catalog/ProductRow.jsx"},{"name":"PromoBadge","sourcePath":"components/catalog/PromoBadge.jsx"},{"name":"Rating","sourcePath":"components/catalog/Rating.jsx"},{"name":"VendorCard","sourcePath":"components/catalog/VendorCard.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"SectionHeading","sourcePath":"components/core/SectionHeading.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Wordmark","sourcePath":"components/core/Wordmark.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"SearchBar","sourcePath":"components/forms/SearchBar.jsx"}],"sourceHashes":{"components/catalog/CategoryTile.jsx":"1e0255c59fbc","components/catalog/NumberedStep.jsx":"daba46ea79c1","components/catalog/ProductRow.jsx":"61f0f53de570","components/catalog/PromoBadge.jsx":"d5654e0ef513","components/catalog/Rating.jsx":"f9c20ab20a10","components/catalog/VendorCard.jsx":"4c3076e656d0","components/core/Button.jsx":"f608341b48f1","components/core/Chip.jsx":"b99516f346b0","components/core/Eyebrow.jsx":"ca22a49ad5b7","components/core/SectionHeading.jsx":"74ebce43f937","components/core/Tag.jsx":"2442e96b3a44","components/core/Wordmark.jsx":"8329a019eeaf","components/forms/Field.jsx":"73745eff21ba","components/forms/SearchBar.jsx":"401ee08fd2a5","ui_kit/eventory-web/Chrome.jsx":"eaf4df31e29f","ui_kit/eventory-web/Discover.jsx":"1552d39d8044","ui_kit/eventory-web/Home.jsx":"4915a59fe17e","ui_kit/eventory-web/data.jsx":"950b0020027a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.EventoryDesignSystem_d28b5d = window.EventoryDesignSystem_d28b5d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/catalog/CategoryTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CategoryTile({
  name,
  code,
  photo,
  height = 200,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: {
      position: 'relative',
      display: 'block',
      width: '100%',
      height,
      border: 0,
      padding: 0,
      overflow: 'hidden',
      borderRadius: 'var(--radius-card)',
      background: 'var(--ink)',
      cursor: 'pointer',
      textAlign: 'left',
      ...style
    }
  }, rest), photo && /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.62
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0.1) 70%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 16
    }
  }, code && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: 'var(--track-label)',
      color: 'var(--fg-on-dark)'
    }
  }, code), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: 'var(--track-heading)',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--ink-on)'
    }
  }, name)));
}
Object.assign(__ds_scope, { CategoryTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/CategoryTile.jsx", error: String((e && e.message) || e) }); }

// components/catalog/NumberedStep.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  dark: {
    background: 'var(--ink)',
    color: 'var(--ink-on)',
    border: '1px solid var(--ink)',
    body: 'var(--fg-on-dark)',
    num: 'var(--fg-2)'
  },
  band: {
    background: 'var(--surface-band)',
    color: 'var(--ink)',
    border: '1px solid var(--surface-band)',
    body: 'var(--fg-2)',
    num: 'var(--line-dim)'
  },
  plain: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--line-hairline)',
    body: 'var(--fg-2)',
    num: 'var(--line-dim)'
  }
};
function NumberedStep({
  number,
  title,
  tone = 'plain',
  children,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.plain;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 'var(--radius-card)',
      background: t.background,
      border: t.border,
      color: t.color,
      padding: 24,
      display: 'flex',
      gap: 20,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: 'var(--track-title)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 'var(--leading-body)',
      color: t.body
    }
  }, children)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 34,
      color: t.num,
      lineHeight: 1
    }
  }, number));
}
Object.assign(__ds_scope, { NumberedStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/NumberedStep.jsx", error: String((e && e.message) || e) }); }

// components/catalog/PromoBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PromoBadge({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--accent-promo)',
      color: 'var(--accent-on)',
      padding: '5px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: 'var(--track-label)',
      textTransform: 'uppercase',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { PromoBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/PromoBadge.jsx", error: String((e && e.message) || e) }); }

// components/catalog/Rating.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Rating({
  value,
  count,
  stars,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      ...style
    }
  }, rest), stars !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--star)',
      fontSize: 14,
      letterSpacing: '2px'
    }
  }, '★'.repeat(stars), '☆'.repeat(Math.max(0, 5 - stars))), value !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, stars === undefined ? '★ ' : '', value, count ? ' (' + count + ')' : ''));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/Rating.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VARIANTS = {
  solid: {
    background: 'var(--ink)',
    color: 'var(--ink-on)',
    border: '1px solid var(--ink)'
  },
  accent: {
    background: 'var(--accent)',
    color: 'var(--accent-on)',
    border: '1px solid var(--accent)'
  },
  outline: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--ink)'
  },
  subtle: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line-control)'
  },
  quiet: {
    background: 'transparent',
    color: 'var(--fg-3)',
    border: 0
  },
  onDark: {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--surface)'
  }
};
const SIZES = {
  sm: {
    padding: '9px 16px',
    fontSize: 14
  },
  md: {
    padding: '11px 22px',
    fontSize: 14
  },
  lg: {
    padding: '14px 26px',
    fontSize: 15
  }
};
function Button({
  variant = 'solid',
  size = 'md',
  display = false,
  full = false,
  disabled = false,
  children,
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.solid;
  const s = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: {
      ...v,
      ...s,
      fontFamily: display ? 'var(--font-display)' : 'var(--font-sans)',
      fontWeight: 700,
      letterSpacing: display ? 'var(--track-title)' : 0,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      width: full ? '100%' : undefined,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/catalog/ProductRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProductRow({
  name,
  description,
  terms,
  priceLabel,
  added = false,
  onAdd,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 20,
      borderTop: '1px solid var(--line-hairline)',
      padding: '18px 2px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 'var(--track-title)'
    }
  }, name), description && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 'var(--leading-body)',
      color: 'var(--fg-3)'
    }
  }, description), terms && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--fg-6)'
    }
  }, terms)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      justifyItems: 'end',
      flexShrink: 0
    }
  }, priceLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      fontWeight: 700
    }
  }, priceLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: added ? 'accent' : 'solid',
    onClick: onAdd
  }, added ? 'Added' : 'Add')));
}
Object.assign(__ds_scope, { ProductRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/ProductRow.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  on = false,
  count,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      border: '1px solid ' + (on ? 'var(--ink)' : 'var(--line-control)'),
      borderRadius: 'var(--radius-pill)',
      background: on ? 'var(--ink)' : 'var(--surface)',
      color: on ? 'var(--ink-on)' : 'var(--ink)',
      padding: '9px 16px',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      ...style
    }
  }, rest), children, count !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: on ? 'var(--ink-on)' : 'var(--fg-6)'
    }
  }, count));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  lg: {
    fontSize: 11.5,
    letterSpacing: 'var(--track-eyebrow)'
  },
  md: {
    fontSize: 11,
    letterSpacing: 'var(--track-label)'
  },
  sm: {
    fontSize: 10,
    letterSpacing: 'var(--track-label)'
  }
};
function Eyebrow({
  size = 'md',
  tone = 'muted',
  children,
  style,
  ...rest
}) {
  const tones = {
    muted: 'var(--fg-6)',
    mid: 'var(--fg-5)',
    dark: 'var(--ink)',
    onDark: 'var(--fg-on-dark)',
    accent: 'var(--accent)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      color: tones[tone] || tones.muted,
      ...(SIZES[size] || SIZES.md),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeading.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LEVELS = {
  h1: {
    fontSize: 46,
    lineHeight: 'var(--leading-h1)',
    letterSpacing: 'var(--track-display)'
  },
  h2: {
    fontSize: 40,
    lineHeight: 'var(--leading-h2)',
    letterSpacing: 'var(--track-display)'
  },
  h3: {
    fontSize: 30,
    lineHeight: 'var(--leading-tight)',
    letterSpacing: 'var(--track-heading)'
  }
};
function SectionHeading({
  level = 'h2',
  eyebrow,
  lead,
  children,
  style,
  ...rest
}) {
  const Tag = level === 'h1' ? 'h1' : level === 'h3' ? 'h3' : 'h2';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gap: 12,
      ...style
    }
  }, rest), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: 'var(--track-label)',
      textTransform: 'uppercase',
      color: 'var(--fg-6)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement(Tag, {
    style: {
      margin: 0,
      fontWeight: 800,
      ...(LEVELS[level] || LEVELS.h2)
    }
  }, children), lead && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 'var(--measure-narrow)',
      fontSize: 15,
      lineHeight: 'var(--leading-body)',
      color: 'var(--fg-3)'
    }
  }, lead));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      border: '1px solid var(--line-chip)',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      padding: '5px 11px',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--fg-2)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/catalog/VendorCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function VendorCard({
  name,
  location,
  description,
  tags = [],
  rating,
  priceLabel,
  action = 'View profile',
  onAction,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 16,
      border: '1px solid var(--line-hairline)',
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface)',
      padding: 20,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 'var(--radius-pill)',
      flexShrink: 0,
      background: 'var(--ink)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: 'var(--track-title)'
    }
  }, name), location && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, location), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      maxWidth: 'var(--measure)',
      fontSize: 14,
      lineHeight: 'var(--leading-body)',
      color: 'var(--fg-2)'
    }
  }, description), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, rating && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, "\u2605 ", rating), priceLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, priceLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    onClick: onAction,
    style: {
      marginLeft: 'auto'
    }
  }, action))));
}
Object.assign(__ds_scope, { VendorCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/catalog/VendorCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Wordmark({
  size = 22,
  tone = 'ink',
  style,
  ...rest
}) {
  const colors = {
    ink: 'var(--ink)',
    light: 'var(--ink-on)',
    accent: 'var(--accent)',
    true: 'var(--ink-true)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: 'var(--font-display-black)',
      fontWeight: 800,
      fontSize: size,
      letterSpacing: 'var(--track-heading)',
      lineHeight: 'var(--leading-wordmark)',
      color: colors[tone] || colors.ink,
      display: 'inline-block',
      ...style
    }
  }, rest), "Eventory");
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  hint,
  error,
  as = 'input',
  style,
  inputStyle,
  ...rest
}) {
  const El = as;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: 'var(--track-label)',
      textTransform: 'uppercase',
      color: 'var(--fg-6)'
    }
  }, label), /*#__PURE__*/React.createElement(El, _extends({
    style: {
      border: '1px solid var(--line-chip)',
      borderRadius: 'var(--radius-input)',
      background: 'var(--surface-sunken)',
      padding: '12px 14px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--ink)',
      width: '100%',
      resize: as === 'textarea' ? 'vertical' : undefined,
      minHeight: as === 'textarea' ? 96 : undefined,
      ...inputStyle
    }
  }, rest)), hint && !error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--fg-3)'
    }
  }, hint), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--danger)'
    }
  }, error));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchBar({
  placeholder = 'Search vendors',
  value,
  onChange,
  onSubmit,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: '1px solid var(--line-chip)',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-sunken)',
      padding: '6px 8px 6px 18px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--fg-6)',
      flexShrink: 0
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      background: 'transparent',
      padding: '9px 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--ink)',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSubmit,
    style: {
      border: 0,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--ink)',
      color: 'var(--ink-on)',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
      flexShrink: 0
    }
  }, "Search"));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchBar.jsx", error: String((e && e.message) || e) }); }

// ui_kit/eventory-web/Chrome.jsx
try { (() => {
const {
  Button,
  Wordmark,
  Eyebrow
} = window.EventoryDesignSystem_d28b5d;
function Header({
  screen,
  go,
  count
}) {
  const link = (label, target) => /*#__PURE__*/React.createElement("button", {
    onClick: go(target),
    style: {
      border: 0,
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
      color: screen === target ? 'var(--ink)' : 'var(--fg-3)'
    }
  }, label);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '22px 0 20px',
      borderBottom: '1px solid var(--line-hairline)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: go('home'),
    style: {
      border: 0,
      background: 'transparent',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 22
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 22,
      marginLeft: 8
    }
  }, link('Discover Vendors', 'discover'), link('Sourcing', 'home'), link('About', 'home'), link('Join Eventory', 'home')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      border: 0,
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--ink)'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      border: '1px solid var(--ink)',
      borderRadius: 999,
      background: 'transparent',
      padding: '9px 9px 9px 18px',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700
    }
  }, "Your Eventory", /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 24,
      height: 24,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: count ? 'var(--accent)' : 'var(--surface)',
      color: count ? 'var(--ink-on)' : 'var(--ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      border: count ? 0 : '1px solid var(--line-control)'
    }
  }, count))));
}
function Footer({
  go
}) {
  const col = (title, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    size: "sm"
  }, title), items.map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: go('home'),
    style: {
      border: 0,
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 14,
      color: 'var(--fg-3)'
    }
  }, i)));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      marginTop: 64,
      paddingTop: 40,
      borderTop: '1px solid var(--line-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 64,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 340,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: '-0.02em'
    }
  }, "Eventory"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--fg-3)'
    }
  }, "Discovery and sourcing for events in Trinidad & Tobago. Browse vendors, compare what they offer, and message them directly.")), col('Plan', ['Discover Vendors', 'Plan Your Event', 'Sourcing request', 'Your Eventory']), col('Vendors', ['Join Eventory', 'Spotlight', 'Vendor FAQ']), col('Company', ['About Eventory', 'Contact us', 'Privacy'])), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34,
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.06em',
      color: 'var(--fg-6)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Eventory. All rights reserved."), /*#__PURE__*/React.createElement("span", null, "Eventory never processes payment. You deal directly with each vendor.")));
}
Object.assign(window, {
  Header,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kit/eventory-web/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kit/eventory-web/Discover.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SectionHeading,
  VendorCard,
  Chip,
  Eyebrow,
  SearchBar,
  Button
} = window.EventoryDesignSystem_d28b5d;
const {
  useState
} = React;
function Discover({
  cart,
  setCart
}) {
  const [loc, setLoc] = useState(0);
  const [cat, setCat] = useState('ALL');
  const [q, setQ] = useState('');
  const cats = ['ALL'].concat(CATS.map(c => c[1]));
  const shown = VENDORS.filter(v => (cat === 'ALL' || v.cat === cat) && (q.trim() === '' || (v.name + v.description).toLowerCase().includes(q.trim().toLowerCase())) && (loc === 0 || v.location.startsWith(LOCATIONS[loc])));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 34
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    level: "h1",
    lead: "Browse every vendor on Eventory, or narrow down by category, location and price."
  }, "Discover Vendors"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search vendors"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      padding: '16px 0',
      borderTop: '1px solid var(--line-hairline)',
      borderBottom: '1px solid var(--line-hairline)',
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    size: "md",
    style: {
      letterSpacing: 'var(--track-label-tight)'
    }
  }, "Category"), cats.map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c,
    on: cat === c,
    onClick: () => setCat(c)
  }, c === 'ALL' ? 'All categories' : c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    size: "md",
    style: {
      letterSpacing: 'var(--track-label-tight)'
    }
  }, "Location"), LOCATIONS.map((l, i) => /*#__PURE__*/React.createElement(Chip, {
    key: l,
    on: loc === i,
    onClick: () => setLoc(i)
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, shown.length, " ", shown.length === 1 ? 'vendor' : 'vendors'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'grid',
      gap: 16
    }
  }, shown.map(v => /*#__PURE__*/React.createElement(VendorCard, _extends({
    key: v.name
  }, v, {
    action: cart.includes(v.name) ? 'Added' : 'Add to Eventory',
    onAction: () => setCart(cart.includes(v.name) ? cart.filter(n => n !== v.name) : cart.concat([v.name]))
  }))), shown.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-band)',
      padding: 28,
      display: 'grid',
      gap: 14,
      justifyItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'var(--fg-2)'
    }
  }, "Nothing here fits? Tell us what you need and we will go find it."), /*#__PURE__*/React.createElement(Button, {
    variant: "outline"
  }, "Send a sourcing request"))));
}
Object.assign(window, {
  Discover
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kit/eventory-web/Discover.jsx", error: String((e && e.message) || e) }); }

// ui_kit/eventory-web/Home.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  SectionHeading,
  CategoryTile,
  VendorCard,
  NumberedStep,
  SearchBar,
  Eyebrow,
  Wordmark
} = window.EventoryDesignSystem_d28b5d;
function Home({
  go
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    size: "lg",
    tone: "mid",
    style: {
      marginTop: 4
    }
  }, "Discovery and sourcing for events"), /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 18,
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--ink-hero)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 300
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/hero-photo.jpg",
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.62
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      padding: '26px 28px 30px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display-black)',
      fontSize: 'clamp(64px,15.5vw,300px)',
      lineHeight: 0.86,
      letterSpacing: '-0.02em',
      color: 'var(--ink-true)'
    }
  }, "Eventory"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    display: true
  }, "Plan Your Event"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "subtle",
    display: true,
    onClick: go('discover')
  }, "Browse vendors")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    placeholder: "Search vendors, categories, locations",
    onSubmit: go('discover')
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 64
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    lead: "Pick the category that fits your event to see who's available."
  }, "What are you looking for?"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16
    }
  }, CATS.slice(0, 4).map(c => /*#__PURE__*/React.createElement(CategoryTile, {
    key: c[0],
    code: c[0],
    name: c[1],
    height: 200,
    photo: c[3] ? '../../assets/categories/' + c[3] + '.jpg' : undefined,
    onClick: go('discover')
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 64
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    lead: "Find vendors for your next event."
  }, "Featured Vendors"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'grid',
      gap: 16
    }
  }, VENDORS.slice(0, 2).map(v => /*#__PURE__*/React.createElement(VendorCard, _extends({
    key: v.name
  }, v, {
    onAction: go('discover')
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 64
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, null, "How Eventory Works"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(NumberedStep, {
    number: "01",
    tone: "dark",
    title: "Find what you need"
  }, "Choose your event and browse vendors and what they offer."), /*#__PURE__*/React.createElement(NumberedStep, {
    number: "02",
    tone: "band",
    title: "Send one inquiry each"
  }, "Each vendor gets only their own items and your note, then messages you back directly with availability, pricing and details."), /*#__PURE__*/React.createElement(NumberedStep, {
    number: "03",
    tone: "plain",
    title: "Nothing here fits?"
  }, "Tell us what you're looking for and we'll help you find it.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontSize: 14,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    size: "md"
  }, "Note"), /*#__PURE__*/React.createElement("span", null, "Eventory does not process payments. You deal directly with each vendor."))));
}
Object.assign(window, {
  Home
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kit/eventory-web/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kit/eventory-web/data.jsx
try { (() => {
const CATS = [['CAT.01', 'Catering', 'Food service, bar packages, staffed or drop-off, dietary options.', 'catering'], ['CAT.02', 'Venues', 'Halls, warehouses, gyms, fields and outdoor sites with capacity notes.', 'venues'], ['CAT.03', 'Décor', 'Florals, styling, table settings, backdrops and thematic decor.', null], ['CAT.04', 'Rentals', 'Tables, chairs, linens, tents, lounge sets, delivery and pickup.', 'rentals'], ['CAT.06', 'Production', 'Sound, screens, projection and an operator on site.', 'production'], ['CAT.08', 'Photography', 'Event coverage, headshot booths, same-day edits and video.', 'photography'], ['CAT.09', 'Entertainment', 'DJs, bands, live performers, MCs, hosts and speakers.', 'entertainment']];
const VENDORS = [{
  name: 'Sundown Sound',
  location: 'Scarborough, Tobago',
  cat: 'Entertainment',
  description: 'DJs and hosts who read a corporate room. Brings its own small PA, so you can skip a separate AV order for parties under 150.',
  tags: ['Own PA', 'Corporate', 'MC & host'],
  rating: '4.9 (18)',
  priceLabel: 'From TT$3,200'
}, {
  name: 'Island Table Catering',
  location: 'Port of Spain, Trinidad',
  cat: 'Catering',
  description: 'Staffed buffet and plated service with a standing vegan and halal menu. Drop-off available under 40 guests.',
  tags: ['Staffed service', 'Vegan options', 'Bar package'],
  rating: '4.8 (32)',
  priceLabel: 'From TT$85 / head'
}, {
  name: 'Chaguanas Event Rentals',
  location: 'Chaguanas, Trinidad',
  cat: 'Rentals',
  description: 'Tables, chairs, linens and lounge sets with delivery and pickup across central Trinidad.',
  tags: ['Delivery', 'Tents', 'Lounge sets'],
  rating: '4.6 (24)',
  priceLabel: 'From TT$1,400'
}, {
  name: 'Northern Range Studio',
  location: 'Arima, Trinidad',
  cat: 'Photography',
  description: 'Event coverage with same-day edits, plus a headshot booth for corporate days.',
  tags: ['Same-day edits', 'Headshot booth', 'Video'],
  rating: '4.9 (41)',
  priceLabel: 'From TT$2,800'
}];
const LOCATIONS = ['All areas', 'Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Tobago'];
Object.assign(window, {
  CATS,
  VENDORS,
  LOCATIONS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kit/eventory-web/data.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CategoryTile = __ds_scope.CategoryTile;

__ds_ns.NumberedStep = __ds_scope.NumberedStep;

__ds_ns.ProductRow = __ds_scope.ProductRow;

__ds_ns.PromoBadge = __ds_scope.PromoBadge;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.VendorCard = __ds_scope.VendorCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.SearchBar = __ds_scope.SearchBar;

})();
