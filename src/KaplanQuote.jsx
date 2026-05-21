import { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import './kaplanQuote.css';
import {
  fetchCourses,
  fetchLanguages,
  fetchDestinations,
  fetchDurations,
  fetchAccommodationTypes,
  fetchProficiencyLevels,
  fetchNationalities,
  fetchPricing,
  submitQuoteRequest,
  getCourseTypeOptions,
  fetchStartDates,
} from './utils/CongaAPI';


const COMPARE_FIELDS = [
  { key: 'courseTitle',       label: 'Course'        },
  { key: 'courseTypeTitle',   label: 'Course type'   },
  { key: 'language',          label: 'Language'      },
  { key: 'destinationTitle',  label: 'Destination'   },
  { key: 'duration',          label: 'Duration'      },
  { key: 'startDate',         label: 'Start date'    },
  { key: 'accommodationTitle',label: 'Accommodation' },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes kq-spin { to { transform: rotate(360deg); } }
  .kq-spinner {
    width: 40px; height: 40px;
    border: 3px solid #cce4f7;
    border-top-color: #0e56a3;
    border-radius: 50%;
    animation: kq-spin 0.8s linear infinite;
  }`;

export default function KaplanQuote() {
  const [step, setStep] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingE, setSubmittingE] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [savedQuotes, setSavedQuotes] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Dynamic data from API (initialised with fallbacks)
  const [courses, setCourses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [durations, setDurations] = useState([]);
  const [startDates, setStartDates] = useState([]);
  const [accommodationTypes, setAccommodationTypes] = useState([]);
  const [proficiencyLevels, setProficiencyLevels] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [priceMap, setPriceMap] = useState([]);

  // Form selections
  const [lang, setLang] = useState("English");
  const [course, setCourse] = useState("general");
  const [courseType, setCourseType] = useState("");
  const [destination, setDestination] = useState("uk");
  const [duration, setDuration] = useState("8 weeks");
  const [accommodation, setAccommodation] = useState("residence");
  const [startDate, setStartDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [level, setLevel] = useState("Intermediate");

  // Load all reference data in parallel on mount
  useEffect(() => {
    const loadAllData = async () => {
      setDataLoading(true);


      const [
        coursesResult,
        languagesResult,
        destinationsResult,
        durationsResult,
        accommodationResult,
        levelsResult,
        nationalitiesResult,
        startDateResult
      ] = await Promise.allSettled([
        fetchCourses(),
        fetchLanguages(),
        fetchDestinations(),
        fetchDurations(),
        fetchAccommodationTypes(),
        fetchProficiencyLevels(),
        fetchNationalities(),
        fetchStartDates(),
      ]);

      if (coursesResult.status === 'fulfilled' && coursesResult.value.length) {
        setCourses(coursesResult.value);
        setCourse(coursesResult.value[0].id);
      }
      if (languagesResult.status === 'fulfilled' && languagesResult.value.length) {
        setLanguages(languagesResult.value);
        setLang(languagesResult.value[0]);
      }
      if (destinationsResult.status === 'fulfilled' && destinationsResult.value.length) {
        setDestinations(destinationsResult.value);
        setDestination(destinationsResult.value[0].id);
      }
      
      if (durationsResult.status === 'fulfilled' && durationsResult.value.length) {
        setDurations(durationsResult.value);
        setDuration(durationsResult.value[0]);
      }
      if (startDateResult.status === 'fulfilled' && startDateResult.value.length) {
        setStartDates(startDateResult.value);
        setStartDate(startDateResult.value[0]);
      }
      if (accommodationResult.status === 'fulfilled' && accommodationResult.value.length) {
        setAccommodationTypes(accommodationResult.value);
        setAccommodation(accommodationResult.value[0].id);
      }
      if (levelsResult.status === 'fulfilled' && levelsResult.value.length) {
        setProficiencyLevels(levelsResult.value);
        setLevel(levelsResult.value[0]);
      }
      if (nationalitiesResult.status === 'fulfilled' && nationalitiesResult.value.length) {
        setNationalities(nationalitiesResult.value);
      }

      setDataLoading(false);
    };

    loadAllData();
  }, []);

  // Refresh pricing whenever the course or destination changes
  useEffect(() => {
    if (!course || !destination) return;
    fetchPricing(course, destination)
      .then((map) => { if (Object.keys(map).length) setPriceMap(map); })
      .catch(() => {});
  }, [course, destination]);

  // Reset courseType when the selected bundle changes
  useEffect(() => {
    const opts = getCourseTypeOptions(courses.find(c => c.id === course)?.options);
    setCourseType(opts.length ? opts[0].id : '');
  }, [course, courses]);

  const selectedCourse = courses.find(c => c.id === course);
  const courseTypeOptions = getCourseTypeOptions(selectedCourse?.options);

  const selectedDest = destinations.find((d) => d.id === destination);
  const price = priceMap[duration] ?? 3640;

  const TOTAL_STEPS = 6;
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmitQuote = async () => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {

      const textDate = startDate;
      const dateObject = new Date(`${textDate.split(" ")[0]} 1, ${textDate.split(" ")[1]}`);

      await submitQuoteRequest({
        bundleId: course,
        optionId: courseType,
        language: lang,
        destinationId: destination,
        duration,
        dateObject,
        accommodation,
        firstName,
        lastName,
        email,
        nationality,
        proficiencyLevel: level,
        listPrice: price,
      });
      setSubmitStatus('success');
      toast.success('Quote sent Successfully!' , { duration: 4500 });

      setTimeout(() => {
        // Reset all form data
        setStep(1);
        setLang(languages[0] ?? "English");
        setCourse(courses[0]?.id ?? "general");
        setDestination(destinations[0]?.id ?? "uk");
        setDuration(durations[0] ?? "8 weeks");
        setStartDate(startDates[0] ?? "");
        setAccommodation(accommodationTypes[0]?.id ?? "residence");
        setLevel(proficiencyLevels[0] ?? "Intermediate");
        setFirstName("");
        setLastName("");
        setEmail("");
        setNationality("");
      }, 3000);


    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuoteEmail = async () => {
    setSubmittingE(true);
    setSubmitStatus(null);
    try {
      const textDate = startDate;
      const dateObject = new Date(`${textDate.split(" ")[0]} 1, ${textDate.split(" ")[1]}`);

      await submitQuoteRequest({
        courseId: course,
        courseType,
        language: lang,
        destinationId: destination,
        duration,
        dateObject,
        accommodation,
        firstName,
        lastName,
        email,
        nationality,
        proficiencyLevel: level,
        estimatedPrice: price,
        sendEmail: true,
      });
      setSubmitStatus('success');

      toast.success('Quote sent Successfully!' , { duration: 4500 });
      
      setTimeout(() => {
        // Reset all form data
        setStep(1);
        setLang(languages[0] ?? "English");
        setCourse(courses[0]?.id ?? "general");
        setDestination(destinations[0]?.id ?? "uk");
        setDuration(durations[0] ?? "8 weeks");
        setStartDate(startDates[0] ?? "");
        setAccommodation(accommodationTypes[0]?.id ?? "residence");
        setLevel(proficiencyLevels[0] ?? "Intermediate");
        setFirstName("");
        setLastName("");
        setEmail("");
        setNationality("");
        setSubmitStatus("");
      }, 5000);

    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmittingE(false);
    }
  };

  const handleSaveAndCompare = () => {
    setSavedQuotes(prev => [...prev, {
      id: Date.now(),
      courseTitle:        selectedCourse?.title ?? '—',
      courseTypeTitle:    courseTypeOptions.find(o => o.id === courseType)?.title ?? '—',
      language:           lang,
      destinationFlag:    selectedDest?.flag ?? '',
      destinationTitle:   selectedDest?.title ?? '—',
      duration,
      startDate:          startDate || 'Flexible',
      accommodationTitle: accommodationTypes.find(a => a.id === accommodation)?.title ?? '—',
      price,
    }]);
    setStep(1);
    setStartDate('');
    setSubmitStatus(null);
  };

  const handleRemoveQuote = (id) => setSavedQuotes(prev => prev.filter(q => q.id !== id));

  if (dataLoading) {
    return (
      <>
        <style>{styles}</style>
        <Toaster  containerStyle={{ zIndex: 99999 }} /> {/* Required container */}
        <div className="kq-root">
          <div className="kq-card">
            <div className="kq-header">
              <div className="kq-logo">
                <div className="kq-logo-icon">🎓</div>
                <span className="kq-logo-text">Kaplan Language Group - KLG</span>
              </div>
            </div>
            <div className="kq-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div className="kq-spinner" />
              <p style={{ marginTop: 16, color: '#6a9bc0', fontSize: 14 }}>Loading your options…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <Toaster  containerStyle={{ zIndex: 99999 }} /> {/* Required container */}
      <div className="kq-root">
        <div className="kq-card">

          {/* Header */}
          <div className="kq-header">
            <div className="kq-logo">
              <div className="kq-logo-icon">🎓</div>
              <span className="kq-logo-text">Kaplan Language Group - KLG</span>
            </div>
            {savedQuotes.length > 0 ? (
              <button className="kq-tab active" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => setShowComparison(true)}>
                ⊞ Compare ({savedQuotes.length})
              </button>
            ) : (
              <div className="kq-timer">⏱ ~3 min</div>
            )}
          </div>

          {showComparison ? (
            <div className="kq-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 className="kq-screen-title" style={{ margin: 0 }}>Compare quotes</h2>
                <button className="kq-btn-secondary" onClick={() => setShowComparison(false)}>← Back</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#6a9bc0', fontWeight: 500, minWidth: 130 }}></th>
                      {savedQuotes.map((q, i) => (
                        <th key={q.id} style={{ textAlign: 'left', padding: '8px 12px', color: '#0d1b2e', fontWeight: 600, minWidth: 160 }}>
                          Quote {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map(({ key, label }) => (
                      <tr key={key} style={{ borderTop: '1px solid #e8f0f7' }}>
                        <td style={{ padding: '10px 12px', color: '#6a9bc0', fontWeight: 500 }}>{label}</td>
                        {savedQuotes.map(q => (
                          <td key={q.id} style={{ padding: '10px 12px', color: '#0d1b2e' }}>
                            {key === 'destinationTitle' ? `${q.destinationFlag} ${q[key]}` : q[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #cce4f7', background: '#f0f7ff' }}>
                      <td style={{ padding: '12px', color: '#0d1b2e', fontWeight: 600 }}>Estimated total</td>
                      {savedQuotes.map(q => (
                        <td key={q.id} style={{ padding: '12px', color: '#0e56a3', fontWeight: 700, fontSize: 16 }}>
                          £{q.price.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderTop: '1px solid #e8f0f7' }}>
                      <td style={{ padding: '12px' }}></td>
                      {savedQuotes.map(q => (
                        <td key={q.id} style={{ padding: '12px' }}>
                          <button className="kq-btn-secondary" style={{ fontSize: 12, padding: '6px 10px', width: '100%' }}
                            onClick={() => handleRemoveQuote(q.id)}>
                            Remove
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              {savedQuotes.length < 3 && (
                <button className="kq-btn-outline-full" style={{ marginTop: 16 }} onClick={() => setShowComparison(false)}>
                  + Configure another quote
                </button>
              )}
            </div>
          ) : (
          <>
          {/* Progress */}
          <div className="kq-progress">
            <div className="kq-steps">
              {[ "Course", "Language", "Destination", "Dates", "Your info", "Quote"].map((label, i) => {
                const n = i + 1;
                const cls = n < step ? "kq-step done" : n === step ? "kq-step active" : "kq-step";
                return (
                  <div className={cls} key={n}>
                    <div className="kq-step-circle">{n < step ? "✓" : n}</div>
                    <span className="kq-step-label">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="kq-body">

            {/* Step 1: Course */}
            
            {step === 1 && (
              <div>
                <h2 className="kq-screen-title">What would you like to study?</h2>
                <p className="kq-screen-sub">Choose a course to get started</p>
                <div className="kq-tabs">
                  {courses.map((c) => (
                    <button key={c.id} className={`kq-tab${course === c.id ? " active" : ""}`} onClick={() => setCourse(c.id)}>{c.title}</button>
                  ))}
                </div>
              <div style={{ marginTop: 16, marginBottom: 20 }}>
                {courseTypeOptions.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0d1b2e", marginBottom: 4 }}>Course type</p>
                    <p style={{ fontSize: 13, color: "#6a9bc0", fontWeight: 300, marginBottom: 12 }}>Select the type of course you want</p>
                    <div className="kq-grid-2">
                      {courseTypeOptions.map(opt => (
                        <div key={opt.id} className={`kq-option${courseType === opt.id ? " selected" : ""}`} onClick={() => setCourseType(opt.id)}>
                          <h4>{opt.title}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="kq-nav">
                  <button className="kq-btn-primary" onClick={next}>Continue →</button>
                </div>
              </div></div>
            )}

            {step === 2 && (
              <div>
                <h2 className="kq-screen-title">Language</h2>
                <p className="kq-screen-sub">Select the Language you want</p>
                <div style={{ marginTop: 16, marginBottom: 20 }}>
                  {/* <p style={{ fontSize: 13, fontWeight: 600, color: "#0d1b2e", marginBottom: 8 }}>Language</p>
                  <div className="kq-tabs">
                    {languages.map((l) => (
                      <button key={l} className={`kq-tab${lang === l ? " active" : ""}`} onClick={() => setLang(l)}>{l}</button>
                    ))}
                  </div> */}

                  {languages.length > 0 && (
                  <div>
                    
                    <div className="kq-grid-2">
                      {languages.map(l => (
                        <div key={l} className={`kq-option${lang === l ? " selected" : ""}`} onClick={() => setLang(l)}>
                          <h4>{l}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="kq-nav">
                  <button className="kq-btn-secondary" onClick={prev}>← Back</button>
                  <button className="kq-btn-primary" onClick={next}>Continue →</button>
                </div>

                </div>
                </div>
                )}

            {/* Step 3: Destination */}
            {step === 3 && (
              <div>
                <h2 className="kq-screen-title">Choose your destination</h2>
                <p className="kq-screen-sub">Where would you like to study?</p>
                <div className="kq-grid-2">
                  {destinations.map((d) => (
                    <div key={d.id} className={`kq-dest${destination === d.id ? " selected" : ""}`} onClick={() => setDestination(d.id)}>
                      <span className="kq-dest-flag">{d.flag}</span>
                      <div>
                        <h4>{d.title}</h4>
                        <p>{d.cities}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="kq-nav">
                  <button className="kq-btn-secondary" onClick={prev}>← Back</button>
                  <button className="kq-btn-primary" onClick={next}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 4: Dates & Accommodation */}
            {step === 4 && (
              <div>
                <h2 className="kq-screen-title">When do you want to study?</h2>
                <p className="kq-screen-sub">Select your preferred start date and duration</p>
                <div className="kq-grid-2">
                  <div className="kq-form-group">
                    <label className="kq-label">Start date</label>
                    <div className="kq-select-wrap">
                      <select className="kq-select" value={startDate} onChange={(e) => setStartDate(e.target.value)}>
                        {startDates.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    {/* <input className="kq-input" placeholder="e.g. September 2025" value={startDate} onChange={(e) => setStartDate(e.target.value)} /> */}
                  </div>
                  <div className="kq-form-group">
                    <label className="kq-label">Duration</label>
                    <div className="kq-select-wrap">
                      <select className="kq-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                        {durations.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0d1b2e", marginBottom: 8 }}>Accommodation</p>
                <p style={{ fontSize: 13, color: "#6a9bc0", fontWeight: 300, marginBottom: 16 }}>Optional — we can arrange housing for you</p>
                <div className="kq-grid-3">
                  {accommodationTypes.map((a) => (
                    <div key={a.id} className={`kq-option${accommodation === a.id ? " selected" : ""}`} onClick={() => setAccommodation(a.id)}>
                      <span className="kq-option-icon">{a.icon}</span>
                      <h4>{a.title}</h4>
                      <p>{a.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="kq-nav">
                  <button className="kq-btn-secondary" onClick={prev}>← Back</button>
                  <button className="kq-btn-primary" onClick={next}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 5: Personal Info */}
            {step === 5 && (
              <div>
                <h2 className="kq-screen-title">A little about you</h2>
                <p className="kq-screen-sub">We'll use this to personalise your quote</p>
                <div className="kq-grid-2">
                  <div className="kq-form-group">
                    <label className="kq-label">First name</label>
                    <input className="kq-input" placeholder="Your first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="kq-form-group">
                    <label className="kq-label">Last name</label>
                    <input className="kq-input" placeholder="Your last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="kq-form-group">
                  <label className="kq-label">Email address</label>
                  <input className="kq-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="kq-grid-2">
                  <div className="kq-form-group">
                    <label className="kq-label">Nationality</label>
                    <div className="kq-select-wrap">
                      <select className="kq-select" value={nationality} onChange={(e) => setNationality(e.target.value)}>
                        <option value="">Select country…</option>
                        {nationalities.map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="kq-form-group">
                    <label className="kq-label">Current level</label>
                    <div className="kq-select-wrap">
                      <select className="kq-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                        {proficiencyLevels.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="kq-nav">
                  <button className="kq-btn-secondary" onClick={prev}>← Back</button>
                  <button className="kq-btn-primary" onClick={next}>Get my quote →</button>
                </div>
              </div>
            )}

            {/* Step 6: Quote */}
            {step === 6 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 className="kq-screen-title" style={{ margin: 0 }}>Your personalised quote</h2>
                  <span className="kq-badge kq-badge-green">✓ Ready</span>
                </div>
                <p className="kq-screen-sub">Based on your selections — prices in GBP</p>

                <div className="kq-summary">
                  <div className="kq-summary-row"><span>Course</span><span>{selectedCourse?.title} · {duration}</span></div>
                  {courseType && <div className="kq-summary-row"><span>Course type</span><span>{courseTypeOptions.find(o => o.id === courseType)?.title}</span></div>}
                  <div className="kq-summary-row"><span>Destination</span><span>{selectedDest?.flag} {selectedDest?.title}</span></div>
                  <div className="kq-summary-row"><span>Start date</span><span>{startDate || "Flexible"}</span></div>
                  <div className="kq-summary-row"><span>Accommodation</span><span>{accommodationTypes.find((a) => a.id === accommodation)?.title}</span></div>
                  <div className="kq-summary-row"><span>Lessons per week</span><span>20 lessons</span></div>
                  {firstName && <div className="kq-summary-row"><span>Student</span><span>{firstName} {lastName}</span></div>}
                </div>

                <div className="kq-price-box">
                  <div>
                    <p className="kq-price-label">Estimated total</p>
                    <p className="kq-price-amount">£{price.toLocaleString()}</p>
                    <p className="kq-price-note">Includes tuition + accommodation · excludes flights & visa</p>
                  </div>
                  <div className="kq-badges" style={{ flexDirection: "column", alignItems: "flex-end" }}>
                    <span className="kq-badge kq-badge-gold">🛡 Price guarantee</span>
                    <span className="kq-badge kq-badge-green">🔄 Free rescheduling</span>
                  </div>
                </div>

                {submitStatus === 'success' && (
                  <p style={{ color: '#15803d', fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
                    ✓ Quote request sent! We'll be in touch shortly.
                  </p>
                )}
                {submitStatus === 'error' && (
                  <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
                    Failed to send quote request. Please try again.
                  </p>
                )}

                <button className="kq-btn-full" onClick={handleSubmitQuote} disabled={submitting}>
                  {submitting ? 'Sending…' : '✉ Request full quote by email'}
                </button>
                
                <button className="kq-btn-full" onClick={handleSubmitQuoteEmail} disabled={submittingE}>
                  {submittingE ? 'Sending…' : '✉ Connect with Admission consultant '}
                </button>

                {savedQuotes.length < 3 && (
                  <button className="kq-btn-outline-full" onClick={handleSaveAndCompare}>
                    ⊞ Save & compare another
                  </button>
                )}
                <button className="kq-btn-outline-full" onClick={() => setStep(1)}>✎ Modify selections</button>
              </div>
            )}

          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
}
