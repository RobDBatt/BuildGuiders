/**
 * helpers/rehype-affiliate.ts
 * Temporary no-op rehype plugin so imports succeed.
 * Later, you can modify this to rewrite affiliate links.
 */
const rehypeAffiliate = () => {
  return (tree: any) => {
    // no-op: just return the tree unchanged
    return tree;
  };
};

export default rehypeAffiliate;
export { rehypeAffiliate };
