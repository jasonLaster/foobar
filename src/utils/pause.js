// @flow
import type { Pause, Frame } from "../types";
import { get } from "lodash";

export function updateFrameLocations(
  frames: Frame[],
  sourceMaps: any
): Promise<Frame[]> {
  if (!frames || frames.length == 0) {
    return Promise.resolve(frames);
  }

  return Promise.all(
    frames.map(frame => {
      return sourceMaps.getOriginalLocation(frame.location).then(loc => {
        return Object.assign({}, frame, {
          location: loc
        });
      });
    })
  );
}

// Map protocol pause "why" reason to a valid L10N key
// These are the known unhandled reasons:
// "breakpointConditionThrown", "clientEvaluated"
// "interrupted", "attached"
const reasons = {
  debuggerStatement: "whyPaused.debuggerStatement",
  breakpoint: "whyPaused.breakpoint",
  exception: "whyPaused.exception",
  resumeLimit: "whyPaused.resumeLimit",
  pauseOnDOMEvents: "whyPaused.pauseOnDOMEvents",
  breakpointConditionThrown: "whyPaused.breakpointConditionThrown",

  // V8
  DOM: "whyPaused.breakpoint",
  EventListener: "whyPaused.pauseOnDOMEvents",
  XHR: "whyPaused.xhr",
  promiseRejection: "whyPaused.promiseRejection",
  assert: "whyPaused.assert",
  debugCommand: "whyPaused.debugCommand",
  other: "whyPaused.other"
};

export function getPauseReason(pauseInfo: Pause): string | null {
  if (!pauseInfo) {
    return null;
  }

  const reasonType = get(pauseInfo, "why.type", null);
  if (!reasons[reasonType]) {
    console.log("Please file an issue: reasonType=", reasonType);
  }
  return reasons[reasonType];
}

export async function getPausedPosition(pauseInfo: Pause, sourceMaps: any) {
  let { frames } = pauseInfo;
  frames = await updateFrameLocations(frames, sourceMaps);
  const frame = frames[0];
  const { location } = frame;
  return location;
}
