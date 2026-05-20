import { useState, useEffect } from "react";
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
} from './utils/CongaAPI';


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
  const [submitStatus, setSubmitStatus] = useState(null);

  // Dynamic data from API (initialised with fallbacks)
  const [courses, setCourses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [durations, setDurations] = useState([]);
  const [accommodationTypes, setAccommodationTypes] = useState([]);
  const [proficiencyLevels, setProficiencyLevels] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [priceMap, setPriceMap] = useState([]);

  // Form selections
  const [lang, setLang] = useState("English");
  const [course, setCourse] = useState("general");
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

       const fetchData = async () => {
        try {
          const response = await fetch('https://pinksamurais5--congacpq.sandbox.my.salesforce.com/services/oauth2/token', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/x-www-form-urlencoded'
                                            },
                                            body: new URLSearchParams({
                                              grant_type: 'client_credentials', // or authorization_code
                                            })
                                          });
          
          // fetch doesn't throw on 404/500, check manualy
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log(result);
          if (result && result.access_token) {
            const token = result.access_token;
          }
        } catch (error) {
          console.error("Fetch error:", error.message);
        }
      };

      fetchData();

      const [
        coursesResult,
        languagesResult,
        destinationsResult,
        durationsResult,
        accommodationResult,
        levelsResult,
        nationalitiesResult,
      ] = await Promise.allSettled([
        fetchCourses(),
        fetchLanguages(),
        fetchDestinations(),
        fetchDurations(),
        fetchAccommodationTypes(),
        fetchProficiencyLevels(),
        fetchNationalities(),
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

      selectedCourse = courses?.find((c) => c.id === course);

  }, [course, destination]);

  let  selectedCourse;

  const selectedDest = destinations.find((d) => d.id === destination);
  const price = priceMap[duration] ?? 3640;

  const TOTAL_STEPS = 5;
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmitQuote = async () => {
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      await submitQuoteRequest({
        courseId: course,
        language: lang,
        destinationId: destination,
        duration,
        startDate,
        accommodation,
        firstName,
        lastName,
        email,
        nationality,
        proficiencyLevel: level,
        estimatedPrice: price,
      });
      setSubmitStatus('success');
    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="kq-root">
          <div className="kq-card">
            <div className="kq-header">
              <div className="kq-logo">
                <div className="kq-logo-icon">🎓</div>
                <span className="kq-logo-text">Kaplan International</span>
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
      <div className="kq-root">
        <div className="kq-card">

          {/* Header */}
          <div className="kq-header">
            <div className="kq-logo">
              <div className="kq-logo-icon">🎓</div>
              <span className="kq-logo-text">Kaplan International</span>
            </div>
            <div className="kq-timer">⏱ ~3 min</div>
          </div>

          {/* Progress */}
          <div className="kq-progress">
            <div className="kq-steps">
              {["Course", "Destination", "Dates", "Your info", "Quote"].map((label, i) => {
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
                <p className="kq-screen-sub">Choose a course type to get started</p>
                <div className="kq-tabs">
                  {languages.map((l) => (
                    <button key={l} className={`kq-tab${lang === l ? " active" : ""}`} onClick={() => setLang(l)}>{l}</button>
                  ))}
                </div>
                <div className="kq-grid-2">
                  {courses && courses.length && courses.map((c) => (
                    <div key={c.id} className={`kq-option${course === c.id ? " selected" : ""}`} onClick={() => setCourse(c.id)}>
                      <span className="kq-option-icon">{c.icon}</span>
                      <h4>{c.title}</h4>
                      <p>{c.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="kq-nav">
                  <button className="kq-btn-primary" onClick={next}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 2: Destination */}
            {step === 2 && (
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

            {/* Step 3: Dates & Accommodation */}
            {step === 3 && (
              <div>
                <h2 className="kq-screen-title">When do you want to study?</h2>
                <p className="kq-screen-sub">Select your preferred start date and duration</p>
                <div className="kq-grid-2">
                  <div className="kq-form-group">
                    <label className="kq-label">Start date</label>
                    <input className="kq-input" placeholder="e.g. September 2025" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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

            {/* Step 4: Personal Info */}
            {step === 4 && (
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

            {/* Step 5: Quote */}
            {step === 5 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 className="kq-screen-title" style={{ margin: 0 }}>Your personalised quote</h2>
                  <span className="kq-badge kq-badge-green">✓ Ready</span>
                </div>
                <p className="kq-screen-sub">Based on your selections — prices in GBP</p>

                <div className="kq-summary">
                  <div className="kq-summary-row"><span>Course</span><span>{selectedCourse?.title} · {duration}</span></div>
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
                <button className="kq-btn-outline-full" onClick={() => setStep(1)}>✎ Modify selections</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
