/**
 * helpers/rehype-drop-first-h1.ts
 * Temporary no-op rehype plugin. Intended to drop the first <h1>,
 * but currently just passes the tree through untouched.
 */
const rehypeDropFirstH1 = () => {
  return (tree: any) => {
    // no-op for now
    return tree;
  };
};

export default rehypeDropFirstH1;
export { rehypeDropFirstH1 };
