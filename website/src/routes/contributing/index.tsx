// import matter from 'gray-matter'
import * as Content from './contributing.mdx';

console.log(Content);
export function Contributing() {
  return (
    <div>
      <h1>Hello,world</h1>
      <Content.default/>
    </div>
  );
}
