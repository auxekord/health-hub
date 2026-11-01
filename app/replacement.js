/* Replacement drafts never mutate the plan before the existing guarded confirmation. */
(() => {
  'use strict';
  const H=window.HealthHub,M=window.HHModel;
  const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==null)n.textContent=text;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const button=(label,fn)=>{const b=el('button',label,{type:'button',class:'btn alt'});b.addEventListener('click',fn);return b;};
  const dialog=el('dialog',null,{id:'replacement-picker',class:'phase-dialog','aria-labelledby':'replacement-title'});document.body.append(dialog);
  let original,profile;
  function shell(title,step){dialog.replaceChildren();const row=el('div',null,{class:'row'});row.append(el('h2',title,{id:'replacement-title'}),button('Cancel replacement',()=>dialog.close()));dialog.append(row,el('p',step+' · Original date, meal slot and household portions stay in place until you confirm.',{class:'notice'}));}
  function open(plan,selectedProfile){original=M.clone(plan);profile=selectedProfile || (original.portions.you===0?'wife':original.portions.wife===0?'you':window.HHPhase.getContext().profile);shell('How will this meal be prepared?','Step 1 of 5');const choices=el('div',null,{class:'actionbar'});choices.append(button('Cooked or prepared at home',home),button('Prepared at a restaurant',restaurants));dialog.append(choices);dialog.showModal();}
  function confirm(meal,source,r,selected=profile){const m=M.clone(meal);Object.assign(m,{id:original.id,date:original.date,time:original.time,category:original.category,portions:M.clone(original.portions),plannedId:original.plannedId});delete m.profile;dialog.close();window.HHPhase.editor(m,'plan',null,{source,original:M.clone(original),restaurant:r,profile:selected});}
  function home(){shell('Choose a home-prepared meal','Steps 2–3 of 5 · Existing Kitchen & 139 recipes');
    const search=el('input',null,{type:'search',placeholder:'Search recipes or ingredients','aria-label':'Search home recipes'}),category=el('select',null,{'aria-label':'Filter home recipes by meal'});category.append(el('option','All meal categories',{value:''}));for(const k of M.CATEGORIES)category.append(el('option',k,{value:k}));
    const list=el('div',null,{id:'replacement-recipes',class:'catalog-grid'}),status=el('p','',{role:'status'});
    const controls=el('div',null,{class:'phase-fields'}),searchLabel=el('label','Search recipes or ingredients'),categoryLabel=el('label','Meal category');searchLabel.append(search);categoryLabel.append(category);controls.append(searchLabel,categoryLabel);
    dialog.append(controls,button('Create custom home-prepared meal',()=>confirm(M.blankMeal(original.date),'home')),el('h3','Kitchen saved home meals'));
    const favorites=H.state.phase2.favorites.filter(f=>f.kind==='Home-cooked');for(const f of favorites)dialog.append(button('Choose saved home meal: '+f.name,()=>confirm(f,'home')));if(!favorites.length)dialog.append(el('p','No saved home meals yet. Choose a recipe or build a custom meal.',{class:'mini'}));dialog.append(status,list,button('Back to preparation source',()=>{dialog.close();open(original);}));
    function draw(){list.replaceChildren();const q=search.value.trim().toLowerCase();const rows=H.recipes.filter(r=>(!category.value||r.mealCategories?.includes(category.value))&&[r.name,r.tags,...r.items.map(x=>x[0])].join(' ').toLowerCase().includes(q));status.textContent=rows.length+' of '+H.recipes.length+' existing recipes';for(const r of rows){const card=el('article',null,{class:'entry'}),details=el('details');details.append(el('summary','Ingredients and original cooking instructions'));for(const [name,a,b]of r.items)details.append(el('p',name+': '+a+' g / '+b+' g household base portions',{class:'mini'}));const steps=el('ol');for(const step of r.steps)steps.append(el('li',step));details.append(steps);card.append(el('h3',r.name),el('p',(r.mealCategories||[]).join(', ')),details,button('Choose recipe: '+r.name,()=>confirm(M.fromRecipe(r,original.date,H.state),'home')));list.append(card);}if(!rows.length)list.append(el('p','No matching recipes. Try another search or create a custom home meal.'));}
    search.addEventListener('input',draw);category.addEventListener('change',draw);draw();
  }
  function restaurants(){dialog.close();window.HHRestaurants.open({mode:'plan',date:original.date,category:original.category,replacement:true,deferSave:true,activeProfile:profile,profiles:()=>H.state.phase2.profiles,actual:window.HHPhase.actual,commit:window.HHPhase.commit,
    onPlate(r){const m=M.blankMeal(original.date);Object.assign(m,{kind:'Restaurant',name:r.name+' plate',restaurant:r.name,restaurantId:r.id,location:r.location});confirm(m,'restaurant',r);},
    onReuse(saved,r,selected){const m=M.clone(saved);Object.assign(m,{kind:'Restaurant',restaurant:r.name,restaurantId:r.id,location:r.location});m.components.forEach(c=>c.id=M.id());confirm(m,'restaurant',r,selected||profile);},
  });}
  window.HHReplacement={open};
})();
