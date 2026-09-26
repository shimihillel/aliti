const goalForm=$('#goalForm');
const number=n=>Number(n).toFixed(1).replace(/\.0$/,'');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function saveGoal(){localStorage.setItem(GOAL_KEY,JSON.stringify(goal));}
function renderGoal(){
  const el=$('#goalSummary');
  $('#editGoal').textContent=goal?'עריכת יעד':'הגדרת יעד';
  if(!goal){el.innerHTML='<p class="goal-lead">לאן מתקדמות מכאן?</p><p class="goal-sub">יעד קטן לדרך, או פשוט לשמור על הקיים.</p><div class="goal-decoration" aria-hidden="true">✦ <span>בקצב שלך</span></div>';return;}
  if(!entries.length){el.innerHTML='<p class="goal-lead">היעד שלך שמור</p><p class="goal-sub">הוסיפי שקילה כדי לראות איפה את ביחס ליעד.</p>';return;}
  const current=entries[entries.length-1].weight;
  const state=GoalMath.calculate(goal,current);
  if(goal.mode==='maintain'){
    el.innerHTML=`<p class="goal-kicker">שומרת על הקיים</p><p class="goal-lead">${state.within?'את בטווח שבחרת':`${number(Math.abs(state.difference))} ק״ג ${state.difference>0?'מעל':'מתחת'} למשקל הבסיס`}</p><p class="goal-sub">סביב ${number(goal.start)} ק״ג · טווח של ±${number(goal.tolerance)} ק״ג</p><div class="maintenance-track" role="img" aria-label="${state.within?'בתוך הטווח':'מחוץ לטווח'}, המשקל הנוכחי ${number(current)} קילוגרם"><span class="safe-zone"></span><span class="maintenance-marker" style="left:${state.position}%"></span></div><div class="range-labels"><span>${number(state.low)} ק״ג</span><span>${number(state.high)} ק״ג</span></div><p class="goal-foot">${state.within?'השקילה האחרונה נמצאת בתוך הטווח שלך.':`הטווח שבחרת הוא ${number(state.low)}–${number(state.high)} ק״ג.`}</p>`;
  }else{
    const deadline=new Date(goal.deadline+'T12:00:00');
    const deadlineLabel=new Intl.DateTimeFormat('he-IL',{day:'numeric',month:'long',year:'numeric'}).format(deadline);
    const overdue=goal.deadline<today();
    const movedAway=state.change<0;
    el.innerHTML=`<p class="goal-kicker">${goal.mode==='lose'?'ירידה':'עלייה'} של ${number(state.total)} ק״ג · עד ${deadlineLabel}</p><p class="goal-lead">${state.reached?'הגעת ליעד שלך!':`עוד <strong>${number(state.remaining)}</strong> ק״ג ליעד`}</p><div class="progress-meta"><span>${state.reached?'היעד הושג':movedAway?'המרחק מהיעד גדל':`${number(state.change)} מתוך ${number(state.total)} ק״ג`}</span><span>${Math.round(state.percent)}%</span></div><div class="progress-track" role="progressbar" aria-label="התקדמות ליעד" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(state.percent)}" aria-valuetext="${number(state.remaining)} קילוגרם נותרו ליעד"><span style="width:${state.percent}%"></span></div><div class="goal-endpoints"><span>התחלה ${number(goal.start)}</span><span>יעד ${number(goal.target)} ק״ג</span></div><p class="goal-foot">${overdue&&!state.reached?'תאריך היעד עבר. אפשר לעדכן אותו בעריכת היעד.':state.reached?'אפשר להמשיך מכאן לשמירה על הקיים.':movedAway?`${number(-state.change)} ק״ג בכיוון ההפוך מאז הגדרת היעד.`:'ההתקדמות מתעדכנת עם כל שקילה.'}</p>`;
  }
}
function modeFields(){
  const maintain=goalForm.elements.mode.value==='maintain';
  $('#changeFields').hidden=maintain;$('#maintenanceFields').hidden=!maintain;
  $('#goalAmount').disabled=maintain;$('#goalDate').disabled=maintain;$('#goalTolerance').disabled=!maintain;
  const base=goal && goal.mode===goalForm.elements.mode.value?goal.start:entries.at(-1)?.weight;
  $('#goalStartNote').textContent=base?`משקל הבסיס לחישוב: ${number(base)} ק״ג`:'הוסיפי שקילה ראשונה לפני שמירת היעד.';
}
function closeGoal(){goalForm.hidden=true;$('#goalSummary').hidden=false;$('#editGoal').setAttribute('aria-expanded','false');$('#editGoal').focus();}
$('#editGoal').addEventListener('click',()=>{
  if(!goalForm.hidden){closeGoal();return;}
  goalForm.reset();goalForm.elements.mode.value=goal?.mode||'lose';
  $('#goalAmount').value=goal&&goal.mode!=='maintain'?number(Math.abs(goal.target-goal.start)):'';
  $('#goalDate').value=goal?.deadline||`${new Date().getFullYear()+1}-01-01`;
  $('#goalTolerance').value=goal?.tolerance||1;
  $('#goalError').textContent='';$('#removeGoal').hidden=!goal;
  goalForm.hidden=false;$('#goalSummary').hidden=true;$('#editGoal').setAttribute('aria-expanded','true');
  modeFields();goalForm.querySelector('input:checked').focus();
});
goalForm.addEventListener('change',modeFields);
$('#cancelGoal').addEventListener('click',closeGoal);
$('#removeGoal').addEventListener('click',()=>{if(confirm('להסיר את היעד? השקילות שלך יישארו.')){goal=null;saveGoal();closeGoal();renderGoal();}});
goalForm.addEventListener('submit',ev=>{
  ev.preventDefault();
  if(!entries.length){$('#goalError').textContent='צריך להוסיף שקילה ראשונה כדי לחשב את נקודת ההתחלה.';return;}
  const mode=goalForm.elements.mode.value;
  const start=goal&&goal.mode===mode?goal.start:entries.at(-1).weight;
  const candidate={mode,start,createdAt:goal?.createdAt||new Date().toISOString()};
  if(mode==='maintain') candidate.tolerance=Number($('#goalTolerance').value);
  else{
    candidate.target=GoalMath.round(start+(mode==='lose'?-1:1)*Number($('#goalAmount').value));
    candidate.deadline=$('#goalDate').value;
    if(candidate.deadline<today()){$('#goalError').textContent='בחרי תאריך יעד מהיום והלאה.';return;}
  }
  if(!GoalMath.valid(candidate)){$('#goalError').textContent='בדקי את הערכים. משקל היעד צריך להיות בין 20 ל־300 ק״ג.';return;}
  goal=candidate;saveGoal();closeGoal();renderGoal();
});
