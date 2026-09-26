/* Goal calculations are independent of the interface and local storage. */
(function(root){
  const round = n => Math.round(n * 10) / 10;
  function valid(goal){
    if(!goal || !['lose','gain','maintain'].includes(goal.mode)) return false;
    if(!Number.isFinite(goal.start) || goal.start < 20 || goal.start > 300) return false;
    if(goal.mode === 'maintain') return Number.isFinite(goal.tolerance) && goal.tolerance >= .1 && goal.tolerance <= 10;
    if(!Number.isFinite(goal.target) || goal.target < 20 || goal.target > 300) return false;
    if(goal.mode === 'lose' ? goal.target >= goal.start : goal.target <= goal.start) return false;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(goal.deadline || '')) return false;
    const date = new Date(goal.deadline + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === goal.deadline;
  }
  function calculate(goal, weight){
    if(!valid(goal) || !Number.isFinite(weight)) return null;
    if(goal.mode === 'maintain') {
      const difference = round(weight - goal.start);
      return {difference, within: Math.abs(difference) <= goal.tolerance,
        position: Math.max(0, Math.min(100, 50 + difference / (goal.tolerance * 2) * 50)),
        low: round(goal.start-goal.tolerance), high: round(goal.start+goal.tolerance)};
    }
    const direction = goal.mode === 'lose' ? -1 : 1;
    const total = round(Math.abs(goal.target - goal.start));
    const change = round((weight - goal.start) * direction);
    return {total, change, remaining: round(Math.max(0, total-change)),
      reached: change >= total, percent: Math.max(0, Math.min(100, change/total*100))};
  }
  root.GoalMath = {valid, calculate, round};
})(typeof window === 'undefined' ? globalThis : window);
