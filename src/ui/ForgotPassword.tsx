import { useState } from 'react';
import type { OrisGateway } from '../infrastructure/orisGateway';

export function ForgotPassword({
  gateway,
  initialEmail,
  onBack
}: {
  gateway: OrisGateway;
  initialEmail: string;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError('');
    try {
      await gateway.requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível solicitar a recuperação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="brand-mark large">Ó</div>
          <div><strong>Óris360°</strong><span>Recuperar acesso</span></div>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">SEGURANÇA</span>
          <h1>Esqueci a senha</h1>
          <p>Informe seu e-mail. Quando a API real estiver conectada, o backend executará o processo oficial de recuperação.</p>
        </div>
        <label className="field">
          <span>E-mail</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <button className="button primary" disabled={busy || !email.trim()} onClick={submit}>
          {busy ? 'ENVIANDO…' : 'SOLICITAR RECUPERAÇÃO'}
        </button>
        <button className="button secondary" onClick={onBack}>VOLTAR</button>
        {sent && (
          <div className="integration-result success" role="status">
            Solicitação recebida. Se o e-mail estiver vinculado a uma conta, siga as instruções do canal configurado pelo Óris360°.
          </div>
        )}
        {error && <div className="integration-result error" role="alert">{error}</div>}
      </section>
    </div>
  );
}
