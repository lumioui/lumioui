import * as React from "react";
import { ToolbarSelection } from "./variants/selection";

/** Playground preview — a menu-shoot library whose floating toolbar swaps
 *  into selection mode in place, and whose Delete folds the picked photos
 *  before the bar swaps back. Not installed with the component. */
export function ToolbarDemo() {
  return <ToolbarSelection />;
}
