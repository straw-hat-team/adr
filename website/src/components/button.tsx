import { PropsWithChildren } from "react";

export default function Button(props: PropsWithChildren<{}>) {
  return (
    <button className="rounded border border-black-500 py-4 px-8 pointer font-normal">
      {props.children}
    </button>
  );
}
