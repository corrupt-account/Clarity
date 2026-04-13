import React, { useState, useEffect } from 'react';
import { calculateScoresV8, generateQuickProfile, generateDeepProfile } from './StartupEngineV8';
import './StartupClarity.css';

const stage1Qs = [
  { id: 'q1', text: 'أبحث باستمرار عن أفكار معقدة ونظريات مجردة.', trait: 'openness', facet: 'intellect', reverse: false },
  { id: 'q2', text: 'بيئتي الخارجية يجب أن تكون منظمة جداً لأستطيع التفكير.', trait: 'conscientiousness', facet: 'organization', reverse: false },
  { id: 'q3', text: 'أشعر باستنزاف طاقتي بسرعة في التجمعات الكبيرة.', trait: 'extraversion', facet: 'energy', reverse: true },
  { id: 'q4', text: 'أضع احتياجات الآخرين قبل خططتي الشخصية دائماً.', trait: 'agreeableness', facet: 'empathy', reverse: false }
];

const stage2Qs = [
  { id: 'q5', text: 'لا يمكنني التوقف عن العمل حتى يكون مثالياً 100%.', trait: 'conscientiousness', facet: 'perfectionism', reverse: false },
  { id: 'q6', text: 'أشعر بالتغيرات المحيطة بشكل أعمق من غيري.', trait: 'sensitivity', facet: 'reactivity', reverse: false },
  { id: 'q7', text: 'طاقتي الجسدية تنفد بدون مجهود بدني يذكر.', trait: 'energy', facet: 'burnout', reverse: true },
  { id: 'q8', text: 'أحب توجيه مسار المحادثات وتولي المبادرة.', trait: 'extraversion', facet: 'assertiveness', reverse: false }
];

const TOTAL_Q = 70; 

const ClarityAppV8 = () => {
  const [stage, setStage] = useState('landing'); 
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("typing"); // typing, available, taken

  const [shelf, setShelf] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("🎬 فيلم");

  const [answers, setAnswers] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('clarity_user_profile');
    const savedShelf = localStorage.getItem('clarity_user_shelf');

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setUserProfile(parsed);
      setUsername(parsed.username || "user");
      if (savedShelf) setShelf(JSON.parse(savedShelf));
      setStage('public_profile');
    }
  }, []);

  useEffect(() => {
    if (shelf.length > 0) localStorage.setItem('clarity_user_shelf', JSON.stringify(shelf));
    else localStorage.removeItem('clarity_user_shelf');
  }, [shelf]);

  // FIX 2: USERNAME VALIDATION LOGIC
  useEffect(() => {
    if (username.length === 0) {
      setUsernameStatus("typing");
      return;
    }
    const timer = setTimeout(() => {
      if (username.length < 3) {
        setUsernameStatus("invalid");
      } else if (username.toLowerCase() === "admin" || username.toLowerCase() === "clarity") {
        setUsernameStatus("taken"); // Fake taken validation
      } else {
        setUsernameStatus("available");
      }
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [username]);

  const handleStartOnboarding = (e) => {
    e.preventDefault();
    if (usernameStatus !== "available") return;
    setStage('stage1');
  };

  const handleAnswer = (qObj, value) => {
    const newAnswers = [...answers.filter(a => a.id !== qObj.id), { ...qObj, value }];
    setAnswers(newAnswers);

    const currentBank = stage === 'stage1' ? stage1Qs : stage2Qs;
    if (currentQIndex < currentBank.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      processStage(newAnswers, stage);
    }
  };

  const processStage = (currentAnswers, currentStage) => {
    // FIX 1: Passing the currentStage to override confidence properly for demo
    const { traits, facets, confidence } = calculateScoresV8(currentAnswers, TOTAL_Q, currentStage);

    if (currentStage === 'stage1') {
      const quickProf = generateQuickProfile(traits, confidence);
      setUserProfile({ username, traits, facets, profile: quickProf, isDeep: false });
      setStage('quick_results');
    } else {
      const deepProf = generateDeepProfile(traits, facets, confidence);
      const finalData = { username, traits, facets, profile: deepProf, isDeep: true };

      localStorage.setItem('clarity_user_profile', JSON.stringify(finalData));
      setUserProfile(finalData);
      setStage('public_profile');
    }
  };

  // FIX 3: SHELF DELETION
  const handleAddShelfItem = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    const newItem = { id: Date.now(), title: newItemTitle, type: newItemType };
    setShelf([newItem, ...shelf]);
    setNewItemTitle("");
  };

  const handleDeleteShelfItem = (idToRemove) => {
    setShelf(shelf.filter(item => item.id !== idToRemove));
  };

  const handleShare = () => {
    const profileUrl = `https://clarity.app/u/${username}`;
    if (navigator.share) {
      navigator.share({ title: 'Clarity Identity', url: profileUrl }).catch(console.error);
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert("تم نسخ رابط بروفايلك!");
    }
  };

  const renderQuestion = (bank) => {
    const q = bank[currentQIndex];
    return (
      <div className="q-card fade-in">
        <span className="q-badge">{stage === 'stage1' ? 'المرحلة 1: بناء الأساس' : 'المرحلة 2: التعمق'}</span>
        <h2>{q.text}</h2>
        <div className="opts">
          {[1,2,3,4,5].map(v => <button key={v} onClick={() => handleAnswer(q, v)}>{v}</button>)}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">

      {/* FIX 5: LANDING PAGE */}
      {stage === 'landing' && (
        <div className="landing-page fade-in">
          <div className="logo-huge">Clarity™</div>
          <h1>Understand yourself deeper than labels.</h1>
          <p>ليس مجرد اختبار شخصية، بل منصة لكشف توتراتك الداخلية، أنماطك الخفية، وهويتك الحقيقية.</p>
          <button className="btn-huge pulse" onClick={() => setStage('onboarding')}>اكتشف هويتك الآن</button>
        </div>
      )}

      {stage === 'onboarding' && (
        <form className="intro fade-in" onSubmit={handleStartOnboarding}>
          <h2>اختر هويتك الرقمية</h2>
          <p>هذا الاسم سيكون الرابط الخاص بملفك العام.</p>
          <div className="input-group">
            <span className="domain-prefix">clarity.app/u/</span>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())} 
              placeholder="username" 
              autoFocus 
            />
          </div>

          {/* USERNAME VALIDATION FEEDBACK */}
          <div className="validation-msg">
            {usernameStatus === "typing" && <span className="muted">اكتب 3 أحرف على الأقل...</span>}
            {usernameStatus === "invalid" && <span className="error">❌ قصير جداً</span>}
            {usernameStatus === "taken" && <span className="error">❌ هذا الاسم مستخدم، جرب اسماً آخر</span>}
            {usernameStatus === "available" && <span className="success">✅ هذا الاسم متاح!</span>}
          </div>

          <button type="submit" className={`btn-primary ${usernameStatus !== 'available' ? 'disabled' : ''}`}>بدء التقييم المبدئي ➔</button>
        </form>
      )}

      {stage === 'stage1' && renderQuestion(stage1Qs)}
      {stage === 'stage2' && renderQuestion(stage2Qs)}

      {stage === 'quick_results' && userProfile && (
        <div className="results-card fade-in">
          <h2>البصمة المبدئية</h2>
          <div className="confidence-meter">
            <div className="confidence-fill" style={{ width: `${userProfile.profile.confidenceScore}%` }}></div>
          </div>
          <p className="conf-text">دقة التحليل: {userProfile.profile.confidenceScore}% (مبدئي)</p>

          <p>أقوى سمة: <strong>{userProfile.profile.strongestTrait}</strong></p>
          <p>أسلوب التفكير: {userProfile.profile.thinkingStyle}</p>

          <div className="upsell glow">
            <h3>تحليلك الحالي مبدئي ⚠️</h3>
            <p>لا تتوقف هنا. أكمل التقييم لاكتشاف التناقضات (Tensions) وفتح بروفايلك العام.</p>
            <button onClick={() => { setStage('stage2'); setCurrentQIndex(0); }}>بدء التحليل العميق 🔒</button>
          </div>
        </div>
      )}

      {stage === 'public_profile' && userProfile && (
        <div className="public-profile fade-in">
          <div className="header">
            <div className="avatar"></div>
            <h1>@{userProfile.username}</h1>
            <p className="core-title">{userProfile.profile.identityLayers?.core || 'مستكشف'}</p>
            <button className="share-btn" onClick={handleShare}>شارك بروفايلك 🔗</button>
          </div>

          {userProfile.isDeep && (
            <>
              {/* THE SHELF UI WITH REMOVE FEATURE */}
              <div className="section shelf-section">
                <h3>رفك الشخصي (The Shelf) 📚🎬</h3>
                <form className="add-shelf-form" onSubmit={handleAddShelfItem}>
                  <select value={newItemType} onChange={e => setNewItemType(e.target.value)}>
                    <option>🎬 فيلم</option>
                    <option>📚 كتاب</option>
                  </select>
                  <input type="text" placeholder="اسم العمل..." value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
                  <button type="submit">+</button>
                </form>

                <div className="shelf-grid">
                  {shelf.length === 0 ? <p className="empty-shelf">رفك فارغ حالياً.</p> : 
                    shelf.map(item => (
                      <div key={item.id} className="shelf-item">
                        <div>
                          <span className="s-type">{item.type}</span>
                          <strong className="s-title">{item.title}</strong>
                        </div>
                        <button className="delete-btn" onClick={() => handleDeleteShelfItem(item.id)}>×</button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* FIX 4: CLICKABLE MATCHES */}
              <div className="section matches">
                <h3>التشابك المعرفي (Similarity) 🧬</h3>
                {userProfile.profile.matches.map(m => (
                  <div 
                    key={m.id} 
                    className="m-card clickable" 
                    onClick={() => alert(`سيتم فتح بروفايل ${m.name} قريباً!`)}
                  >
                    <div className="m-avatar">{m.image}</div>
                    <div className="m-info">
                      <strong>{m.name}</strong>
                      <p>{m.desc}</p>
                    </div>
                    <div className="m-score">{m.match}%</div>
                    <div className="m-arrow">›</div>
                  </div>
                ))}
              </div>

              <div className="section tensions">
                <h3>التوترات الداخلية (Tensions) 🔥</h3>
                {userProfile.profile.tensions.map(t => (
                  <div key={t.id} className="t-card">
                    <h4>{t.title}</h4>
                    <p>{t.message}</p>
                    <span className="advice">💡 {t.advice}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button className="reset-btn" onClick={() => { localStorage.clear(); window.location.reload(); }}>تسجيل الخروج</button>
        </div>
      )}
    </div>
  );
};

export default ClarityAppV8;
