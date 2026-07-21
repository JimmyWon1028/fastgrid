import fabui from './fabui.js?v=20260721-initial-filter-rules-v1';
import { createSchedulerFactory } from './scheduler/scheduler.js?v=20260721-mono-variants-v1';

if (!fabui.Scheduler) {
  fabui.Scheduler = createSchedulerFactory(fabui);
}

var Scheduler = fabui.Scheduler;

export { fabui, Scheduler };
export default fabui;
