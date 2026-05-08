"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          {/* Logo */}
          <div className={styles.logoSection}>
            <Image
              src="/images/logo.png"
              alt="BIO-CAPSULE"
              width={80}
              height={80}
              className={styles.logoImage}
              priority
            />
            <h1 className={styles.brandName}>BIO CAPSULE</h1>
            <p className={styles.brandSub}>لوحة التحكم الإدارية</p>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>تسجيل الدخول</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorMsg}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                <span className={styles.labelIcon}>👤</span>
                اسم المستخدم
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className={styles.input}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                <span className={styles.labelIcon}>🔒</span>
                كلمة المرور
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className={styles.input}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  <span>دخول إلى لوحة التحكم</span>
                  <span className={styles.arrowIcon}>←</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <span>🛡️</span>
            <span>منطقة محمية — الوصول للمسؤولين فقط</span>
          </div>
        </div>
      </div>
    </div>
  );
}
