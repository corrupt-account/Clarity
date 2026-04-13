// ==========================================
// CLARITY™ - V8 ENGINE (THE FINAL POLISH)
// Adjusted Confidence Scaling & Rich Character DB
// ==========================================

export const calculateScoresV8 = (answers, totalQuestions, stage) => {
  let traitScores = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, sensitivity: 0, energy: 0 };
  let traitCounts = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, sensitivity: 0, energy: 0 };
  let facetScores = {};

  let answeredCount = 0;

  answers.forEach(q => {
    if (q.value !== undefined) {
      answeredCount++;
      let score = q.value;
      if (q.reverse) score = 6 - score;

      if (!facetScores[q.facet]) facetScores[q.facet] = { total: 0, count: 0 };
      facetScores[q.facet].total += score;
      facetScores[q.facet].count += 1;

      traitScores[q.trait] += score;
      traitCounts[q.trait] += 1;
    }
  });

  let normalizedTraits = {};
  for (let t in traitScores) {
    if (traitCounts[t] > 0) {
      let avg = traitScores[t] / traitCounts[t];
      normalizedTraits[t] = Math.round(((avg - 1) / 4) * 100);
    } else {
      normalizedTraits[t] = 50; 
    }
  }

  let normalizedFacets = {};
  for (let f in facetScores) {
    let avg = facetScores[f].total / facetScores[f].count;
    normalizedFacets[f] = Math.round(((avg - 1) / 4) * 100);
  }

  // FIX 1: CONFIDENCE OVERRIDE FOR DEMO / STAGE 1
  let rawConfidence = Math.round((answeredCount / totalQuestions) * 100);

  // If we are in Stage 1 and confidence is too low due to demo size, enforce a 35% minimum
  let confidenceScore = rawConfidence;
  if (stage === 'stage1' && rawConfidence < 35) {
    confidenceScore = 35;
  } else if (stage === 'stage2' && rawConfidence < 85) {
    confidenceScore = 85; // Enforce high confidence for deep profile in demo
  }

  return { traits: normalizedTraits, facets: normalizedFacets, confidence: confidenceScore };
};

export const generateQuickProfile = (traits, confidence) => {
  const bigFive = { openness: traits.openness, conscientiousness: traits.conscientiousness, extraversion: traits.extraversion, agreeableness: traits.agreeableness, sensitivity: traits.sensitivity };
  let sortedTraits = Object.keys(bigFive).sort((a, b) => bigFive[b] - bigFive[a]);

  const traitNames = { openness: "الانفتاح المعرفي", conscientiousness: "الانضباط والتنظيم", extraversion: "الطاقة الاجتماعية", agreeableness: "التعاطف", sensitivity: "الاستشعار" };

  return {
    isDeep: false,
    confidenceScore: confidence,
    strongestTrait: traitNames[sortedTraits[0]],
    weakestTrait: traitNames[sortedTraits[sortedTraits.length - 1]],
    thinkingStyle: traits.openness > 65 ? "رؤيوي ومجرد" : "واقعي وعملي",
    energyStyle: traits.extraversion > 60 ? "طاقة مكتسبة خارجياً" : "طاقة موجهة داخلياً",
    insight: sortedTraits[0] === 'openness' ? "تفكيرك عميق وتربط بين الأمور المتباعدة." : "تملك نظاماً داخلياً صلباً يقلل من الفوضى المحيطة بك."
  };
};

export const getTensions = (traits, facets) => {
  const { openness: O, conscientiousness: C, extraversion: E, agreeableness: A, sensitivity: S, energy: N } = traits;
  let tensions = [];

  if (C > 70 && S > 65) tensions.push({ id: "inner_pressure", title: "الكمال المرهق", message: "معاييرك الصارمة تصطدم بحساسيتك، مما يخلق ضغطاً صامتاً يستهلك طاقتك.", advice: "طبق مبدأ '80% ممتاز بما فيه الكفاية'." });
  if (E > 60 && N < 45) tensions.push({ id: "social_drain", title: "الاجتماعي المستنزف", message: "تحب التفاعل، لكن بطاريتك تنفد فجأة وتحتاج لانعزال عميق.", advice: "غادر التجمعات وأنت في قمة طاقتك." });
  if (O > 75 && S > 70) tensions.push({ id: "emotional_creativity", title: "الإبداع المكلف", message: "خيالك الواسع يجعلك تشعر بالمتغيرات بشكل قد يربك استقرارك.", advice: "وثق أفكارك كتابياً لتفريغ الحمل المعرفي." });

  return tensions;
};

export const characterDB = [
  { id: "c_nolan", name: "Christopher Nolan", image: "🎬", desc: "مخرج سينمائي يتميز بالهندسة الفكرية والتعقيد.", traits: { openness: 85, conscientiousness: 90, extraversion: 40, agreeableness: 50, sensitivity: 40 }, type: "مخرج" },
  { id: "t_chalamet", name: "Timothée Chalamet", image: "🎭", desc: "ممثل يحمل طابعاً فنياً وحساسية عاطفية عالية.", traits: { openness: 80, conscientiousness: 40, extraversion: 70, agreeableness: 75, sensitivity: 85 }, type: "ممثل" },
  { id: "l_lawliet", name: "L Lawliet", image: "📓", desc: "محقق عبقري يعزل نفسه للوصول للحقائق.", traits: { openness: 95, conscientiousness: 85, extraversion: 10, agreeableness: 20, sensitivity: 45 }, type: "Anime" }
];

export const getSimilarProfiles = (userTraits) => {
  const MAX_DIST = 223.6; 
  return characterDB.map(char => {
    let sumSq = 0;
    ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'sensitivity'].forEach(t => {
      sumSq += Math.pow((userTraits[t] || 50) - char.traits[t], 2);
    });
    return {
      id: char.id,
      name: char.name,
      image: char.image,
      desc: char.desc,
      type: char.type,
      match: Math.round(100 - ((Math.sqrt(sumSq) / MAX_DIST) * 100))
    };
  }).sort((a, b) => b.match - a.match).slice(0, 3);
};

export const generateDeepProfile = (traits, facets, confidence) => {
  let core = traits.openness > 70 ? "رؤيوي (Visionary)" : traits.conscientiousness > 70 ? "منفذ (Executor)" : "واقعي (Pragmatist)";
  let emotionalLayer = traits.sensitivity > 70 ? "استشعار عالي" : "ثابت انفعالياً";
  if (facets.curiosity > 80) core = "مستكشف (Explorer)";

  return {
    isDeep: true,
    confidenceScore: confidence,
    identityLayers: { core, emotionalLayer },
    tensions: getTensions(traits, facets),
    matches: getSimilarProfiles(traits)
  };
};
