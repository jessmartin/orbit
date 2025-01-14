import mdast from "mdast";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import unified from "unified";
import bearIDPlugin, { bearIDNodeType } from "./bearIDPlugin";

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(bearIDPlugin);
const testBearID = "860466DE-8254-47C1-AA71-BA9C0CE18FA3-402-00002ED1CDC440DA";
const input = `# Test node

<!-- {BearID:${testBearID}} -->`;

test("decodes IDs", () => {
  const ast = processor.runSync(processor.parse(input));
  expect((ast as mdast.Root).children).toContainEqual({
    type: bearIDNodeType,
    bearID: testBearID,
  });
});

test("encodes IDs", () => {
  expect(processor.processSync(input).toString().trimRight()).toEqual(input);
});
