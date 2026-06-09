import React, { useState, useEffect, useRef } from 'react';

const QUESTIONS = [
  // Science
  {q:'What planet is closest to the Sun?',a:'Mercury',opts:['Venus','Earth','Mercury','Mars'],cat:'Science'},
  {q:'How many bones are in the adult human body?',a:'206',opts:['156','206','312','108'],cat:'Science'},
  {q:'What gas do plants absorb from the atmosphere?',a:'Carbon dioxide',opts:['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'],cat:'Science'},
  {q:'What is the chemical symbol for Gold?',a:'Au',opts:['Gd','Go','Ag','Au'],cat:'Science'},
  {q:'What is the speed of light (approx km/s)?',a:'300,000',opts:['150,000','300,000','600,000','30,000'],cat:'Science'},
  {q:'What is the hardest natural substance on Earth?',a:'Diamond',opts:['Titanium','Quartz','Diamond','Obsidian'],cat:'Science'},
  {q:'How many chromosomes do humans have?',a:'46',opts:['23','46','48','92'],cat:'Science'},
  {q:'What is H₂O?',a:'Water',opts:['Salt','Water','Hydrogen peroxide','Hydrochloric acid'],cat:'Science'},
  {q:'What force keeps planets in orbit?',a:'Gravity',opts:['Magnetism','Gravity','Friction','Electromagnetism'],cat:'Science'},
  {q:'What organ produces insulin?',a:'Pancreas',opts:['Liver','Kidney','Pancreas','Spleen'],cat:'Science'},
  // Geography
  {q:'What is the largest continent?',a:'Asia',opts:['Africa','Asia','Europe','North America'],cat:'Geography'},
  {q:'What is the longest river in the world?',a:'Nile',opts:['Amazon','Yangtze','Nile','Mississippi'],cat:'Geography'},
  {q:'Which country has the most natural lakes?',a:'Canada',opts:['Russia','Canada','USA','Finland'],cat:'Geography'},
  {q:'What is the capital of Australia?',a:'Canberra',opts:['Sydney','Melbourne','Brisbane','Canberra'],cat:'Geography'},
  {q:'Which desert is the largest in the world?',a:'Antarctic Desert',opts:['Sahara','Gobi','Antarctic Desert','Arabian'],cat:'Geography'},
  {q:'What is the tallest mountain?',a:'Mount Everest',opts:['K2','Kilimanjaro','Mount Everest','Mont Blanc'],cat:'Geography'},
  {q:'How many countries are in Africa?',a:'54',opts:['42','54','68','48'],cat:'Geography'},
  {q:'What ocean is the largest?',a:'Pacific',opts:['Atlantic','Indian','Pacific','Arctic'],cat:'Geography'},
  {q:'Where is the Amazon rainforest primarily located?',a:'Brazil',opts:['Colombia','Peru','Brazil','Venezuela'],cat:'Geography'},
  {q:'What is the smallest country in the world?',a:'Vatican City',opts:['Monaco','San Marino','Vatican City','Liechtenstein'],cat:'Geography'},
  // History
  {q:'In what year did World War II end?',a:'1945',opts:['1943','1944','1945','1946'],cat:'History'},
  {q:'Who was the first US President?',a:'George Washington',opts:['John Adams','Thomas Jefferson','George Washington','Benjamin Franklin'],cat:'History'},
  {q:'In what year did man first land on the Moon?',a:'1969',opts:['1965','1967','1969','1971'],cat:'History'},
  {q:'Who wrote "Romeo and Juliet"?',a:'William Shakespeare',opts:['Christopher Marlowe','Ben Jonson','William Shakespeare','John Milton'],cat:'History'},
  {q:'Which empire was the largest in history?',a:'British Empire',opts:['Roman Empire','Mongol Empire','British Empire','Ottoman Empire'],cat:'History'},
  {q:'When did the French Revolution begin?',a:'1789',opts:['1776','1789','1799','1804'],cat:'History'},
  {q:'Who painted the Mona Lisa?',a:'Leonardo da Vinci',opts:['Michelangelo','Raphael','Leonardo da Vinci','Titian'],cat:'History'},
  {q:'What ancient wonder was in Alexandria?',a:'The Lighthouse',opts:['The Colossus','The Library','The Lighthouse','The Statue'],cat:'History'},
  {q:'Who was the first person to circumnavigate the globe?',a:'Ferdinand Magellan',opts:['Christopher Columbus','Vasco da Gama','Ferdinand Magellan','Francis Drake'],cat:'History'},
  {q:'In what year did the Berlin Wall fall?',a:'1989',opts:['1985','1987','1989','1991'],cat:'History'},
  // Sports
  {q:'How many players are on a standard football team?',a:'11',opts:['9','10','11','12'],cat:'Sports'},
  {q:'In which sport do you use a puck?',a:'Ice Hockey',opts:['Polo','Field Hockey','Ice Hockey','Lacrosse'],cat:'Sports'},
  {q:'How many Grand Slam tennis tournaments are there?',a:'4',opts:['3','4','5','6'],cat:'Sports'},
  {q:'In what sport is the Stanley Cup awarded?',a:'Ice Hockey',opts:['Baseball','Basketball','Ice Hockey','American Football'],cat:'Sports'},
  {q:'How often are the Summer Olympics held?',a:'Every 4 years',opts:['Every 2 years','Every 3 years','Every 4 years','Every 5 years'],cat:'Sports'},
  {q:'What sport uses the term "birdie"?',a:'Golf',opts:['Tennis','Badminton','Golf','Cricket'],cat:'Sports'},
  {q:'How many rings are on the Olympic flag?',a:'5',opts:['4','5','6','7'],cat:'Sports'},
  {q:'What country invented basketball?',a:'USA',opts:['Canada','USA','UK','France'],cat:'Sports'},
  {q:'How long is a marathon (km)?',a:'42.195',opts:['40','42','42.195','44.5'],cat:'Sports'},
  {q:'In tennis, what score follows deuce?',a:'Advantage',opts:['Set point','Match point','Advantage','Tie break'],cat:'Sports'},
  // Entertainment
  {q:'Who played Iron Man in the MCU?',a:'Robert Downey Jr',opts:['Chris Evans','Benedict Cumberbatch','Robert Downey Jr','Mark Ruffalo'],cat:'Entertainment'},
  {q:'How many Harry Potter books are there?',a:'7',opts:['5','6','7','8'],cat:'Entertainment'},
  {q:'Who sang "Thriller"?',a:'Michael Jackson',opts:['Prince','Michael Jackson','David Bowie','Freddie Mercury'],cat:'Entertainment'},
  {q:'What is the highest-grossing film of all time?',a:'Avatar',opts:['Titanic','Avengers: Endgame','Avatar','Star Wars'],cat:'Entertainment'},
  {q:'In what year was the first iPhone released?',a:'2007',opts:['2005','2006','2007','2008'],cat:'Entertainment'},
  {q:'What show features characters Walter White and Jesse Pinkman?',a:'Breaking Bad',opts:['The Wire','Breaking Bad','Better Call Saul','Ozark'],cat:'Entertainment'},
  {q:'Who wrote the "Lord of the Rings" trilogy?',a:'J.R.R. Tolkien',opts:['C.S. Lewis','J.R.R. Tolkien','George R.R. Martin','Terry Pratchett'],cat:'Entertainment'},
  {q:'What is the name of Batman\'s butler?',a:'Alfred',opts:['James','Alfred','Harvey','Lucius'],cat:'Entertainment'},
  {q:'In "The Matrix", what colour pill does Neo take?',a:'Red',opts:['Blue','Green','Red','Yellow'],cat:'Entertainment'},
  {q:'What band performed "Bohemian Rhapsody"?',a:'Queen',opts:['Led Zeppelin','Queen','The Rolling Stones','The Beatles'],cat:'Entertainment'},
];

const CAT_COLORS = {
  Science:'#3498db', Geography:'#27ae60', History:'#e67e22',
  Sports:'#e74c3c', Entertainment:'#9b59b6'
};

const ROUND_TIME = 15;

const HTP=({onClose})=>(
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Trivia Blitz</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Answer more trivia questions correctly than your opponent.</p>
        <h4>How to Play</h4><ul>
          <li>You have {ROUND_TIME} seconds per question.</li>
          <li>Click the correct answer from the 4 options.</li>
          <li>Faster correct answers score more points (up to 3 pts).</li>
          <li>Wrong answer: 0 points. No answer: 0 points.</li>
          <li>10 questions per game.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function TriviaBlitz({gameMode,game,onBack,onExit}) {
  const exit=onBack||onExit||null;
  const isAI=gameMode!=='local';

  const [questions,setQuestions]=useState([]);
  const [qIdx,setQIdx]=useState(0);
  const [pScore,setPScore]=useState(0);
  const [aScore,setAScore]=useState(0);
  const [answered,setAnswered]=useState(null); // player's answer
  const [aiAnswer,setAiAnswer]=useState(null);
  const [timeLeft,setTimeLeft]=useState(ROUND_TIME);
  const [phase,setPhase]=useState('idle'); // idle|question|reveal|done
  const [showHelp,setShowHelp]=useState(false);
  const timerRef=useRef(null);

  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

  const startGame=()=>{
    const qs=shuffle(QUESTIONS).slice(0,10);
    setQuestions(qs); setQIdx(0); setPScore(0); setAScore(0);
    setAnswered(null); setAiAnswer(null); setTimeLeft(ROUND_TIME);
    setPhase('question');
  };

  const currentQ=questions[qIdx];

  // Timer
  useEffect(()=>{
    if(phase!=='question') return;
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current);endQuestion(null);return 0;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[phase,qIdx]);

  // AI answer (after 2-8 seconds, correct 70% of the time)
  useEffect(()=>{
    if(phase!=='question'||!currentQ) return;
    const delay=(2+Math.random()*6)*1000;
    const t=setTimeout(()=>{
      const correct=Math.random()<0.70;
      const ans=correct?currentQ.a:currentQ.opts.filter(o=>o!==currentQ.a)[Math.floor(Math.random()*3)];
      setAiAnswer(ans);
    },delay);
    return()=>clearTimeout(t);
  },[phase,qIdx]);

  const endQuestion=useCallback((playerAns)=>{
    clearInterval(timerRef.current);
    setAnswered(playerAns||'__timeout__');
    setPhase('reveal');
    const pCorrect=playerAns===currentQ?.a;
    const timeBonus=Math.floor(timeLeft/5)+1; // 1-3 points
    if(pCorrect) setPScore(s=>s+timeBonus);
    if(aiAnswer===currentQ?.a) setAScore(s=>s+2);
    setTimeout(()=>{
      if(qIdx>=questions.length-1){setPhase('done');}
      else{
        setQIdx(i=>i+1);setAnswered(null);setAiAnswer(null);
        setTimeLeft(ROUND_TIME);setPhase('question');
      }
    },2200);
  },[currentQ,aiAnswer,timeLeft,qIdx,questions.length]);

  const handleAnswer=(opt)=>{
    if(phase!=='question'||answered) return;
    endQuestion(opt);
  };

  if(phase==='idle') return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'❓'} Trivia Blitz</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>
      <div style={{textAlign:'center',padding:'40px 20px'}}>
        <div style={{fontSize:48,marginBottom:16}}>❓</div>
        <div style={{fontSize:14,color:'#888',marginBottom:24}}>10 questions · 5 categories · {ROUND_TIME}s per question</div>
        <button className="bv-button" style={{fontSize:15,padding:'12px 36px'}} onClick={startGame}>Start Game</button>
      </div>
    </div>
  );

  if(phase==='done') return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      <div className="game-header"><h2 className="bv-title">Trivia Blitz</h2></div>
      <div className="winner-banner">
        {pScore>aScore?'🏆 You Win!':aScore>pScore?'🤖 AI Wins!':'⚖️ Draw!'}
        {' '}You: {pScore} · AI: {aScore}
      </div>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:20}}>
        <button className="bv-button" onClick={startGame}>Play Again</button>
        {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
      </div>
    </div>
  );

  const catColor=CAT_COLORS[currentQ?.cat]||'#888';
  const pct=timeLeft/ROUND_TIME;

  return(
    <div className="game-shell" style={{maxWidth:480,margin:'0 auto'}}>
      {showHelp&&<HTP onClose={()=>setShowHelp(false)}/>}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'❓'} Trivia Blitz</h2>
        <div style={{display:'flex',gap:6}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {/* Scores */}
      <div style={{display:'flex',justifyContent:'space-around',marginBottom:12}}>
        <div className="bv-card" style={{padding:'6px 20px',textAlign:'center'}}>
          <div style={{fontSize:10,color:'#888'}}>You</div>
          <div style={{fontSize:24,color:'#e8b800',fontWeight:'bold'}}>{pScore}</div>
        </div>
        <div style={{alignSelf:'center',fontSize:12,color:'#555'}}>Q {qIdx+1}/10</div>
        {isAI&&<div className="bv-card" style={{padding:'6px 20px',textAlign:'center'}}>
          <div style={{fontSize:10,color:'#888'}}>🤖 AI</div>
          <div style={{fontSize:24,color:'#c0392b',fontWeight:'bold'}}>{aScore}</div>
        </div>}
      </div>

      {/* Timer bar */}
      <div style={{height:6,background:'#1a1a2e',borderRadius:3,overflow:'hidden',marginBottom:14}}>
        <div style={{height:'100%',width:`${pct*100}%`,background:pct>0.5?'#4caf50':pct>0.25?'#f39c12':'#f44336',transition:'width 1s linear,background .5s'}}/>
      </div>

      {/* Category badge */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <div style={{padding:'3px 10px',borderRadius:20,background:`${catColor}22`,border:`1px solid ${catColor}55`,fontSize:11,color:catColor,fontWeight:'bold'}}>
          {currentQ?.cat}
        </div>
        <span style={{fontSize:12,color:'#888'}}>⏱ {timeLeft}s</span>
      </div>

      {/* Question */}
      <div className="bv-card" style={{padding:18,marginBottom:14,minHeight:80}}>
        <p style={{fontSize:16,color:'#e0e0e0',fontWeight:'bold',lineHeight:1.4,margin:0}}>{currentQ?.q}</p>
      </div>

      {/* Options */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {currentQ?.opts.map(opt=>{
          const isCorrect=opt===currentQ.a;
          const pChose=answered===opt;
          const aiChose=aiAnswer===opt;
          let bg='rgba(255,255,255,.05)', border='rgba(255,255,255,.1)', color='#e0e0e0';
          if(phase==='reveal'){
            if(isCorrect){bg='rgba(76,175,80,.15)';border='rgba(76,175,80,.5)';color='#4caf50';}
            else if(pChose&&!isCorrect){bg='rgba(244,67,54,.15)';border='rgba(244,67,54,.5)';color='#f44';}
          }
          return(
            <button key={opt} onClick={()=>handleAnswer(opt)} disabled={phase!=='question'} style={{
              padding:'12px 16px',borderRadius:10,textAlign:'left',fontSize:14,
              background:bg,border:`1px solid ${border}`,color,cursor:phase==='question'?'pointer':'default',
              display:'flex',alignItems:'center',justifyContent:'space-between',
            }}>
              <span>{opt}</span>
              <span style={{fontSize:12}}>
                {pChose&&phase==='reveal'&&(isCorrect?'✓ You':'✗ You')}
                {aiChose&&phase==='reveal'&&` · AI`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
