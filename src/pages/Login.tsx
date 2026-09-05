import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({
  onLogin,
}: LoginProps) {
  const [form, setForm] =
    useState<LoginForm>({
      email: '',
      password: '',
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });

    setError('');
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');

    if (
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setError(
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:3001/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email:
              form.email.trim(),

            password:
              form.password,
          }),
        }
      );

      const data: LoginResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.token
      ) {
        throw new Error(
          data.message ||
            'Invalid email or password.'
        );
      }

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        'token',
        data.token
      );

      if (data.user) {
        storage.setItem(
          'user',
          JSON.stringify(data.user)
        );
      }

      onLogin();

    } catch (err) {
      if (
        err instanceof TypeError
      ) {
        setError(
          'Cannot connect to the server. Make sure the backend is running on port 3001.'
        );
      } else if (
        err instanceof Error
      ) {
        setError(err.message);
      } else {
        setError(
          'Something went wrong. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-bg-shape login-bg-shape-one" />
      <div className="login-bg-shape login-bg-shape-two" />

      <main className="login-wrapper">

        <section className="login-card">

          <div className="brand">

            <div className="brand-icon">
              AI
            </div>

            <div className="brand-text">

              <h1>
                AI Teacher
              </h1>

              <p>
                Learn smarter. Understand better.
              </p>

            </div>

          </div>


          <div className="login-heading">

            <span className="welcome-label">
              WELCOME BACK
            </span>

            <h2>
              Sign in to your account
            </h2>

            <p>
              Continue your learning journey
              with your AI-powered teacher.
            </p>

          </div>


          {error && (
            <div
              className="error-message"
              role="alert"
            >
              <span className="error-icon">
                !
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-box">

                <span className="field-icon">
                  ✉
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>

            </div>


            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-box">

                <span className="field-icon">
                  🔒
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>

              </div>

            </div>


            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                <span className="custom-checkbox" />

                <span>
                  Remember me
                </span>

              </label>


              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  setError(
                    'Password reset will be added soon.'
                  )
                }
              >
                Forgot password?
              </button>

            </div>


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>


          <div className="login-security">
            <span className="security-dot" />

            <span>
              Secure AI Teacher environment
            </span>
          </div>


          <p className="login-bottom-text">
            © 2026 AI Teacher. All rights reserved.
          </p>

        </section>

      </main>

    </div>
  );
}