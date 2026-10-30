import { Fragment, type ReactNode, useEffect, useId } from "react";
import { create } from "zustand";

const usePortals = create<{ nodes: Record<string, ReactNode> }>(() => ({ nodes: {} }));

// Renders its children in <PortalHost />, at the app root above every screen and the tab bar
export function Portal({ children }: { children: ReactNode }) {
  const id = useId();

  useEffect(() => {
    usePortals.setState((s) => (s.nodes[id] === children ? s : { nodes: { ...s.nodes, [id]: children } }));
  }, [id, children]);

  useEffect(
    () => () =>
      usePortals.setState((s) => {
        const { [id]: _removed, ...nodes } = s.nodes;
        return { nodes };
      }),
    [id],
  );

  return null;
}

export function PortalHost() {
  const nodes = usePortals((s) => s.nodes);
  return Object.entries(nodes).map(([id, node]) => <Fragment key={id}>{node}</Fragment>);
}
