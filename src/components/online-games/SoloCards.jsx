import React, { useState, useCallback } from 'react';

/* Klondike Solitaire
 * 7 tableau piles, 4 foundation piles (A→K by suit), stock + waste
 */

const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED_SUITS = new Set(['♥','♦']);
const RANK_VAL = {A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13};

function makeDeck(){
  const d=[];
  for(const s of SUITS) for(const r of RANKS) d.push({suit:s,rank:r,faceUp:false});
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
  return d;
}

function initState(){
  const deck=makeDeck();
  const tableau=Array.from({length:7},(_,i)=>{
    const pile=deck.splice(0,i+1);
    pile[pile.length-1].faceUp=true;
    return pile;
  });
  return {tableau, stock:[...deck], waste:[], foundations:[[], [], [], []], selected:null, won:false, moves:0};
}

function canStack(child, parent){
  if(!parent) return child.rank==='K';
  if(parent.rank==='A') return false;
  return RANK_VAL[child.rank]===RANK_VAL[parent.rank]-1 &&
    RED_SUITS.has(child.suit)!==RED_SUITS.has(parent.suit);
}

function canFoundation(card, fPile){
  if(!fPile.length) return card.rank==='A';
  const top=fPile[fPile.length-1];
  return card.suit===top.suit && RANK_VAL[card.rank]===RANK_VAL[top.rank]+1;
}

function CardFace({card,small,selected,onClick}){
  if(!card) return null;
  const isRed=RED_SUITS.has(card.suit);
  const w=small?42:56, h=small?62:80;
  if(!card.faceUp) return(
    <div onClick={onClick} style={{
      width:w,height:h,borderRadius:7,flexShrink:0,
      background:'linear-gradient(135deg,#1a1a3e,#2a2a5a)',
      border:'1.5px solid #3a3a6a',cursor:onClick?'pointer':'default',
    }}/>
  );
  return(
    <div onClick={onClick} style={{
      width:w,height:h,borderRadius:7,background:'#f5f5f0',flexShrink:0,
      border:selected?'2.5px solid #e8b800':'1.5px solid #ccc',
      boxShadow:selected?'0 0 12px rgba(232,184,0,.7)':undefined,
      cursor:onClick?'pointer':'default', padding:3,position:'relative',
      userSelect:'none',
    }}>
      <div style={{fontSize:small?11:13,fontWeight:'bold',color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.rank}{card.suit}</div>
      <div style={{position:'absolute',bottom:3,right:4,fontSize:small?11:13,fontWeight:'bold',color:isRed?'#c0392b':'#1a1a2e',transform:'rotate(180deg)',lineHeight:1}}>{card.rank}{card.suit}</div>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:small?14:20,color:isRed?'#c0392b':'#1a1a2e'}}>{card.suit}</div>
    </div>
  );
}

export default function SoloCards({game,onBack,onExit}){
  const exit=onBack||onExit||null;
  const [gs,setGs]=useState(initState);
  const [hint,setHint]=useState('');

  const reset=()=>{setGs(initState());setHint('');};

  const update=useCallback(fn=>{
    setGs(prev=>{
      const ns=fn(prev);
      if(ns.foundations.every(f=>f.length===13)) return {...ns,won:true};
      return ns;
    });
  },[]);

  // Deal from stock
  const handleStock=()=>{
    update(prev=>{
      if(!prev.stock.length){
        if(!prev.waste.length) return prev;
        const newStock=[...prev.waste].reverse().map(c=>({...c,faceUp:false}));
        return {...prev,stock:newStock,waste:[],selected:null};
      }
      const card={...prev.stock[prev.stock.length-1],faceUp:true};
      return {...prev,stock:prev.stock.slice(0,-1),waste:[...prev.waste,card],selected:null};
    });
  };

  // Click a card to select or move
  const handleCard=(src,idx,subIdx=null)=>{
    update(prev=>{
      const {selected}=prev;
      // If nothing selected — select this
      if(!selected){
        if(src==='waste'){
          const card=prev.waste[prev.waste.length-1];
          if(card&&card.faceUp) return {...prev,selected:{src:'waste',idx:null,cards:[card]}};
        } else if(src==='tableau'){
          const pile=prev.tableau[idx];
          const sub=subIdx!==null?subIdx:pile.length-1;
          if(sub<0||!pile[sub]?.faceUp) return prev;
          return {...prev,selected:{src:'tableau',idx,subIdx:sub,cards:pile.slice(sub)}};
        } else if(src==='foundation'){
          const f=prev.foundations[idx];
          if(!f.length) return prev;
          const card=f[f.length-1];
          return {...prev,selected:{src:'foundation',idx,cards:[card]}};
        }
        return prev;
      }
      // Something is selected — try to move to clicked destination
      const {cards}=selected;
      const card=cards[0];
      if(src==='tableau'){
        const pile=[...prev.tableau[idx]];
        const top=pile[pile.length-1];
        if(!canStack(card,top||null)) return {...prev,selected:null};
        // Remove from source
        let ns={...prev,selected:null,moves:prev.moves+1};
        if(selected.src==='waste'){ns={...ns,waste:prev.waste.slice(0,-1)};}
        else if(selected.src==='tableau'){
          const sp=[...prev.tableau[selected.idx]].slice(0,selected.subIdx);
          if(sp.length>0) sp[sp.length-1]={...sp[sp.length-1],faceUp:true};
          const nt=[...prev.tableau];nt[selected.idx]=sp;ns={...ns,tableau:nt};
        } else if(selected.src==='foundation'){
          const nf=[...prev.foundations];nf[selected.idx]=prev.foundations[selected.idx].slice(0,-1);ns={...ns,foundations:nf};
        }
        const nt2=[...ns.tableau];nt2[idx]=[...pile,...cards.map(c=>({...c,faceUp:true}))];
        return {...ns,tableau:nt2};
      }
      if(src==='foundation'){
        if(cards.length>1) return {...prev,selected:null}; // can't move multiple to foundation
        const fPile=prev.foundations[idx];
        if(!canFoundation(card,fPile)) return {...prev,selected:null};
        let ns={...prev,selected:null,moves:prev.moves+1};
        if(selected.src==='waste'){ns={...ns,waste:prev.waste.slice(0,-1)};}
        else if(selected.src==='tableau'){
          const sp=[...prev.tableau[selected.idx]].slice(0,selected.subIdx);
          if(sp.length>0) sp[sp.length-1]={...sp[sp.length-1],faceUp:true};
          const nt=[...prev.tableau];nt[selected.idx]=sp;ns={...ns,tableau:nt};
        }
        const nf=[...ns.foundations];nf[idx]=[...fPile,{...card,faceUp:true}];
        return {...ns,foundations:nf};
      }
      return {...prev,selected:null};
    });
  };

  const {tableau,stock,waste,foundations,selected,won,moves}=gs;
  const topWaste=waste[waste.length-1];
  const faceNames=['♠','♥','♦','♣'];

  return(
    <div className="game-shell" style={{maxWidth:600,margin:'0 auto'}}>
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🂡'} Solo Cards</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      {won&&<div className="winner-banner">🏆 You won in {moves} moves!</div>}
      <div style={{display:'flex',gap:6,marginBottom:10,fontSize:11,color:'#888',justifyContent:'flex-end'}}>Moves: {moves}</div>

      {/* Top row: stock + waste + foundations */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        {/* Stock */}
        <div onClick={handleStock} style={{width:56,height:80,borderRadius:7,border:'1.5px dashed #3a3a5a',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#555',background:stock.length?undefined:'rgba(255,255,255,.02)'}}>
          {stock.length?<div style={{width:54,height:78,borderRadius:7,background:'linear-gradient(135deg,#1a1a3e,#2a2a5a)',border:'1px solid #3a3a6a'}}/>:'↺'}
        </div>
        {/* Waste */}
        <div onClick={()=>topWaste&&handleCard('waste',null)} style={{width:56,height:80,borderRadius:7,border:'1.5px dashed #3a3a5a',background:'rgba(255,255,255,.02)'}}>
          {topWaste&&<CardFace card={topWaste} selected={selected?.src==='waste'} onClick={()=>handleCard('waste',null)}/>}
        </div>
        <div style={{flex:1}}/>
        {/* Foundations */}
        {foundations.map((f,fi)=>{
          const top=f[f.length-1];
          return(
            <div key={fi} onClick={()=>handleCard('foundation',fi)} style={{width:56,height:80,borderRadius:7,border:'1.5px dashed #3a3a5a',background:'rgba(255,255,255,.02)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative'}}>
              {top?<CardFace card={top} selected={false} onClick={()=>handleCard('foundation',fi)}/>
              :<span style={{fontSize:20,color:'rgba(255,255,255,.15)'}}>{faceNames[fi]}</span>}
            </div>
          );
        })}
      </div>

      {/* Tableau */}
      <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
        {tableau.map((pile,pi)=>(
          <div key={pi} style={{flex:1,minWidth:0,minHeight:80,position:'relative'}}>
            {pile.length===0?(
              <div onClick={()=>selected&&handleCard('tableau',pi)} style={{width:'100%',height:80,borderRadius:7,border:'1.5px dashed #3a3a5a',background:'rgba(255,255,255,.02)',cursor:selected?'pointer':'default'}}/>
            ):(
              <div style={{position:'relative',height:80+pile.length*18}}>
                {pile.map((card,ci)=>(
                  <div key={ci} style={{position:'absolute',top:ci*18,left:0,right:0}}>
                    <CardFace card={card} small
                      selected={selected?.src==='tableau'&&selected.idx===pi&&ci>=selected.subIdx}
                      onClick={()=>card.faceUp&&handleCard('tableau',pi,ci)}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',fontSize:11,color:'#555',marginTop:10}}>Click a card to select · click destination to move · click stock to deal</div>
    </div>
  );
}
