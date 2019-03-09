/* eslint-disable no-param-reassign */

import { NodePath } from "@babel/traverse";

import Module from "./module";
import { State, StrictOptions } from "./types";
import TaggedTemplateExpression from "./visitors/TaggedTemplateExpression";

export default function extract(
  babel: typeof import("@babel/core"),
  options: StrictOptions
) {
  const { types: t } = babel;

  return {
    visitor: {
      Program: {
        enter(path: NodePath, state: State) {
          // Collect all the style rules from the styles we encounter
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();

          // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor
          path.traverse({
            TaggedTemplateExpression: p =>
              TaggedTemplateExpression(p, state, t, options)
          });
        },
        exit(_: any, state: State) {
          if (Object.keys(state.rules).length) {
            // Store the result as the file metadata
            state.file.metadata = {
              linaria: {
                rules: state.rules,
                replacements: state.replacements,
                dependencies: state.dependencies
              }
            };
          }

          // Invalidate cache for module evaluation when we're done
          Module.invalidate();
        }
      }
    }
  };
}