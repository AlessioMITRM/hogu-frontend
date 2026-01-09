export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9àèéìòùç\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};
