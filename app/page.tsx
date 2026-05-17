"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { trackEvent, generateEventId, getCookie } from "@/lib/tracking";

export default function Home() {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const trackedEvents = useRef<Set<string>>(new Set());
  const [showSticky, setShowSticky] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [whatsappName, setWhatsappName] = useState("");

  useEffect(() => {
    setIsMounted(true);
    // Record page view internally
    fetch("/api/views", { method: "POST" }).catch(() => {});
    
    // Pixel Tracking handled by FacebookPixel.tsx to avoid duplicates
    // trackEvent('PageView');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      let shouldShow = scrollY > 500;

      if (checkoutRef.current) {
        const checkoutRect = checkoutRef.current.getBoundingClientRect();
        // Hide if the checkout section is visible in the viewport
        // Adjust the offset (-100) so it hides slightly before reaching the form fields
        if (checkoutRect.top < window.innerHeight - 100) {
          shouldShow = false;
        }
      }

      setShowSticky(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCheckout = () => {
    if (!trackedEvents.current.has('InitiateCheckout')) {
      const checkoutEventId = generateEventId();
      trackEvent('InitiateCheckout', {}, checkoutEventId);
      trackedEvents.current.add('InitiateCheckout');
    }

    if (checkoutRef.current) {
      checkoutRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      const element = document.getElementById("checkout");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const eventId = generateEventId();
      const fbc = getCookie('_fbc');
      const fbp = getCookie('_fbp');

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, eventId, fbc, fbp }),
      });
      if (res.ok) {
        trackEvent('Purchase', { value: 249, currency: 'MAD' }, eventId);
        setIsSuccess(true);
      }
    } catch (error) {
      alert("حدث خطأ في الاتصال. يرجى التأكد من اتصالك بالإنترنت.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsappOrder = async () => {
    if (isSubmitting) return;
    if (!whatsappName.trim()) {
      alert("يرجى إدخال الاسم الكامل قبل الطلب عبر الواتساب");
      return;
    }
    setIsSubmitting(true);
    try {
      const eventId = generateEventId();
      const fbc = getCookie('_fbc');
      const fbp = getCookie('_fbp');

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: whatsappName.trim(), source: "whatsapp", eventId, fbc, fbp }),
      });
      
      trackEvent('Purchase', { value: 249, currency: 'MAD' }, eventId);

      // Redirect to WhatsApp
      const phone = "212777330305";
      const message = `أريد الاستفادة من باقة 249 درهم BIO CAPSULE\nالاسم: ${whatsappName.trim()}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Failed to save whatsapp order", error);
      alert("حدث خطأ. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main>
      {/* Announcement Bar */}
      <div className={styles.announcementBar}>
        <div className={styles.tickerWrapper}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className={styles.tickerItem}>
              <span>🚚</span>
              الشحن مجاني والدفع عند الاستلام لجميع مناطق المغرب
            </div>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={`container ${styles.navContainer}`}>
          <div className={styles.logo}>
            BIO CAPSULE MAROC
          </div>
          <button onClick={scrollToCheckout} className={styles.navCtaLight}>
            اطلب الآن
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={`${styles.heroContent} animate-fade-up`}>
            <div className={styles.badge}>طبيعي 100% - صنع بأعلى معايير الجودة</div>
            <h1 className={styles.heroTitle}>
              استعد توازنك الطبيعي.<br />
              نهار هادئ ونوم <span>عميق</span>.
            </h1>
            <div className="animate-fade-up delay-100" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
              <Image src="/images/logo.png" alt="BIO-CAPSULE Main Logo" width={250} height={250} style={{objectFit: 'contain'}} priority />
            </div>
            <p className={styles.heroDesc}>
              تخلص من الإجهاد اليومي والأرق المستمر مع باقة 2X PACK. تركيبة متطورة تعتمد على أنقى المستخلصات الطبيعية لتعيد لك طاقتك وراحتك النفسية.
            </p>
            <div className={styles.heroActions}>
              <button onClick={scrollToCheckout} className="btn-primary">
                احصل على الباقة بـ 249 درهم
              </button>
            </div>
          </div>
          <div>
            <div className={`${styles.trustBadges} animate-fade-up delay-100`}>
              <div className={styles.trustLogos}>
                <Image src="/images/onssa.png" alt="ONSSA" width={80} height={40} style={{objectFit: 'contain'}} />
                <Image src="/images/iso.png" alt="ISO" width={40} height={40} style={{objectFit: 'contain'}} />
              </div>
              <div className={styles.trustText}>
                مرخص ومصادق عليه من ONSSA و ISO للسلامة والجودة
              </div>
            </div>
            <div className={styles.bestsellerBadge}>
              <span style={{fontSize: '1.2rem'}}>⭐</span>
              أكثر باقة مبيعاً في المغرب التي الكل يشكرها
            </div>
            <div className={`${styles.heroImageWrapper} animate-fade-up delay-200`}>
              <Image 
                src="/images/new-poster.jpg" 
                alt="Bio Capsule Results" 
                width={800}
                height={1200}
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className={styles.logosSection}>
        <div className="container">
          <p className={styles.logosText}>موثوق وموصى به لجودة مكوناته الطبيعية</p>
          <div className={styles.logosGrid}>
            <span>طبيعي 100%</span>
            <span>بدون مواد حافظة</span>
            <span>مصادق عليه</span>
            <span>نتائج سريعة</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className={`${styles.problemSection} section-padding`}>
        <div className={`container text-center ${styles.sectionHeader} animate-fade-up`}>
          <h2 className={styles.sectionTitle}>تستحق حياه هادئه ومطمئنه</h2>
          <p className={styles.sectionSubtitle}>
            الضغوطات اليومية، التفكير المفرط، وقلة النوم تضعف جهازك المناعي وتؤثر على جودة حياتك. هل تعاني من إحدى هذه المشاكل؟
          </p>
        </div>
        <div className="container">
          <div className={styles.problemCards}>
            <div className={`${styles.problemCard} animate-fade-up delay-100`}>
              <div className={styles.iconWrapper}>🌪️</div>
              <h3>دوامة القلق اللامتناهي</h3>
              <p>هل تجد نفسك عالقاً في أفكار سلبية لا تتوقف؟ التوتر المستمر يستنزف طاقتك النفسية ويجعلك تشعر بالعجز حتى عن أبسط مهامك اليومية.</p>
            </div>
            <div className={`${styles.problemCard} animate-fade-up delay-200`}>
              <div className={styles.iconWrapper}>👁️</div>
              <h3>صراع السرير الضائع</h3>
              <p>تلك الساعات الطويلة وأنت تراقب السقف.. الأرق ليس مجرد تعب، بل هو سارق يسرق منك هدوءك ويتركك شبحاً هزيلاً في اليوم التالي.</p>
            </div>
            <div className={`${styles.problemCard} animate-fade-up delay-300`}>
              <div className={styles.iconWrapper}>🔋</div>
              <h3>استنزاف الروح والجسد</h3>
              <p>الاستيقاظ بتعب أشد مما كنت عليه قبل النوم.. عندما تصبح "القهوة" هي وقودك الوحيد، فاعلم أن جسدك يصرخ طلباً للراحة الحقيقية.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution / Showcase */}
      <section className={`${styles.productSection} section-padding`}>
        <div className="container">
          <div className={styles.productShowcase}>
            <div className={styles.productVisual}>
              <Image 
                src="/images/product-girl.jpg" 
                alt="2X PACK" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className={styles.productDetails}>
              <h2 className={styles.packName}>2X PACK</h2>
              <p className={styles.packDesc}>
                لقد دمجنا أفضل ما في الطبيعة والعلم لابتكار حل مزدوج. كبسولات نهارية للهدوء والتركيز، وكبسولات ليلية لنوم عميق ومريح. العناية المتكاملة التي يستحقها جسمك وعقلك.
              </p>
              <ul className={styles.benefitsList}>
                <li>
                  <div className={styles.checkIcon}>✓</div>
                  يقضي على التوتر ويحسن المزاج بشكل ملحوظ
                </li>
                <li>
                  <div className={styles.checkIcon}>✓</div>
                  يسرع عملية الدخول في النوم ويمنع الأرق
                </li>
                <li>
                  <div className={styles.checkIcon}>✓</div>
                  يضمن لك استيقاظاً مليئاً بالنشاط والحيوية
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className={`${styles.detailsSection} section-padding`}>
        <div className="container">
          <div className={styles.bottlesGrid}>
            
            {/* Stress Card */}
            <div className={`${styles.bottleCard} ${styles.stress}`}>
              <div className={styles.bottleImage}>
                <Image src="/images/nostress-bottle.png" alt="No Stress" fill sizes="(max-width: 768px) 100vw, 50vw" unoptimized style={{objectFit: 'contain'}} />
              </div>
              <div className={styles.bottleContent}>
                <h3 className={styles.bottleTitle}>2X NO STRESS</h3>
                <p className={styles.bottleDesc}>
                  تركيبة نهارية خفيفة وفعالة، تساعدك على مواجهة ضغوطات العمل والحياة بهدوء تام دون أن تسبب لك النعاس أو الخمول.
                </p>
                <h4 className={styles.ingredientsTitle}>مكونات طبيعية مركزة:</h4>
                <ul className={styles.ingredientsList}>
                  <li>الناردين المخزني</li>
                  <li>عشبة القديس يوحنا</li>
                  <li>خلاصة البابونج</li>
                </ul>
                <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
                  <strong>الاستخدام:</strong> كبسولتين يومياً مع وجبة الإفطار أو الغداء.
                </div>
              </div>
            </div>

            {/* Sleep Card */}
            <div className={`${styles.bottleCard} ${styles.sleep}`}>
              <div className={styles.bottleImage}>
                <Image src="/images/sleep-bottle.png" alt="Sleep" fill sizes="(max-width: 768px) 100vw, 50vw" unoptimized style={{objectFit: 'contain'}} />
              </div>
              <div className={styles.bottleContent}>
                <h3 className={styles.bottleTitle}>2X SLEEP</h3>
                <p className={styles.bottleDesc}>
                  كبسولات ليلية مدعمة بالميلاتونين، تعمل على تهيئة جسمك وعقلك للدخول في دورة نوم عميقة وطبيعية لإصلاح الخلايا وتجديد الطاقة.
                </p>
                <h4 className={styles.ingredientsTitle}>مكونات طبيعية مركزة:</h4>
                <ul className={styles.ingredientsList}>
                  <li>الميلاتونين</li>
                  <li>المغنيسيوم</li>
                  <li>L-Theanine</li>
                  <li>خلاصة الزعفران</li>
                </ul>
                <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
                  <strong>الاستخدام:</strong> كبسولة واحدة قبل النوم بنصف ساعة.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Checkout Section */}
      <section className={styles.checkoutSection} ref={checkoutRef} id="checkout">
        <div className="container">
          <div className={styles.checkoutGrid}>
            <div className={styles.checkoutInfo}>
              <div className={styles.guarantee}>
                <span style={{fontSize: '2rem'}}>🛡️</span>
                <span>
                  <strong>الدفع عند الاستلام.</strong> التوصيل مجاني وسريع لجميع مدن المغرب. ضمان الجودة 100%.
                </span>
              </div>
            </div>

            <div className={styles.formBox}>
              {isSuccess ? (
                <div className={styles.successState}>
                  <h3>تم تسجيل طلبك بنجاح! 🎉</h3>
                  <p>شكراً لك. سيتصل بك فريقنا في أقرب وقت لتأكيد عنوان الشحن وإرسال طلبيتك.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={styles.formTicker}>
                    <div className={styles.formTickerWrapper}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.formTickerItem}>
                          <span>🚚</span>
                          الشحن مجاني والدفع عند الاستلام لجميع مناطق المغرب
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.priceBox}>
                    <div className={styles.priceLabel}>السعر الأصلي: 398 درهم</div>
                    <div className={styles.priceValue}>
                      249 <span className={styles.currency}>درهم</span>
                    </div>
                  </div>

                  <div className={styles.csBadge}>
                    <div className={styles.csBadgeIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1C6.48 1 2 5.48 2 11V17.5C2 18.88 3.12 20 4.5 20H6V12H4V11C4 6.58 7.58 3 12 3C16.42 3 20 6.58 20 11V12H18V20H19.5C20.88 20 22 18.88 22 17.5V11C22 5.48 17.52 1 12 1Z" fill="currentColor"/>
                        <path d="M9 14C9.55 14 10 13.55 10 13C10 12.45 9.55 12 9 12C8.45 12 8 12.45 8 13C8 13.55 8.45 14 9 14Z" fill="currentColor"/>
                        <path d="M15 14C15.55 14 16 13.55 16 13C16 12.45 15.55 12 15 12C14.45 12 14 12.45 14 13C14 13.55 14.45 14 15 14Z" fill="currentColor"/>
                        <path d="M18 11.03C17.52 8.18 15.04 6 12.05 6C9.02 6 6 8.51 6 12.05C8.49 12.02 10.72 10.72 11.84 8.72C12.63 10.89 14.56 12.54 16.91 12.96" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                      </svg>
                    </div>
                    <div className={styles.csBadgeContent}>
                      <span className={styles.csBadgeTitle}>خدمة عملاء BIO CAPSULE MAROC</span>
                      <span className={styles.csBadgeText}>فريقنا سيتصل بك في أقرب وقت ممكن لتأكيد طلبك</span>
                    </div>
                    <div className={styles.csBadgePulse} />
                  </div>

                  <h3 className={styles.formTitle}>معلومات الشحن</h3>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">الاسم الكامل</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone">رقم الهاتف</label>
                    <input type="tel" id="phone" name="phone" dir="ltr" style={{textAlign: 'right'}} value={formData.phone} onChange={handleChange} required />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="city">المدينة</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="address">العنوان الكامل</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>

                  <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isSubmitting}>
                    {isSubmitting ? "جاري التأكيد..." : "تأكيد الطلب الآن"}
                  </button>
                  
                  <div className={styles.divider}>
                    <span>أو</span>
                  </div>

                  <div className={styles.whatsappSection}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="whatsappName">الاسم الكامل</label>
                      <input 
                        type="text" 
                        id="whatsappName" 
                        placeholder="أدخل اسمك الكامل" 
                        value={whatsappName} 
                        onChange={e => setWhatsappName(e.target.value)} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleWhatsappOrder}
                      className={styles.whatsappBtn} 
                      disabled={isSubmitting || !whatsappName.trim()}
                    >
                      <span>💬</span>
                      الطلب عبر الواتساب
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Sticky Footer CTA */}
      <div className={styles.stickyContainer}>
        <button 
          onClick={scrollToCheckout} 
          className={`${styles.stickyBtn} ${showSticky ? styles.stickyBtnVisible : ""}`}
        >
          <span>🛒</span>
          اطلب باقة 249 درهم الآن
        </button>
      </div>
    </main>
  );
}
