import { useEffect, useState } from 'react';
import type { Mission } from '../domain/models';
import { getScopeMissions } from '../infrastructure/db';
import { completeMissionOffline } from '../services/missions';
import { useRuntime } from '../app/AppContext';

async function filesToDataUrls(files: FileList | null): Promise<string[]> {
  if (!files) return [];
  const selected = Array.from(files).slice(0, 3);
  return Promise.all(selected.map(file => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));
}

export function Missions() {
  const runtime = useRuntime();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const reload = async () => {
    setMissions((await getScopeMissions(runtime.db, runtime.scopeKey)).sort((a, b) => b.assignedAt.localeCompare(a.assignedAt)));
  };

  useEffect(() => {
    reload();
  }, [runtime.scopeKey, runtime.revision]);

  const open = (mission: Mission) => {
    setEditing(mission);
    setNotes(mission.notes ?? '');
    setEvidence(mission.evidence ?? []);
    setLocation(
      mission.latitude != null && mission.longitude != null
        ? { latitude: mission.latitude, longitude: mission.longitude }
        : null
    );
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      runtime.notify('Localização não está disponível neste dispositivo.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        runtime.notify('Localização registrada como evidência local.', 'success');
      },
      () => runtime.notify('Não foi possível obter a localização. Verifique a permissão.', 'warning'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const complete = async () => {
    if (!editing) return;
    const done = await completeMissionOffline(
      runtime.db,
      editing,
      {
        notes: notes || undefined,
        evidence,
        latitude: location?.latitude,
        longitude: location?.longitude
      },
      new Date().toISOString()
    );
    setEditing(done);
    runtime.notify(
      runtime.online
        ? 'Missão concluída. O retorno poderá ser transmitido automaticamente.'
        : 'Missão concluída offline e armazenada como pendente.',
      'success'
    );
    await runtime.refreshLocal();
    await reload();
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      runtime.notify('Este navegador não oferece notificações.', 'warning');
      return;
    }
    const permission = await Notification.requestPermission();
    runtime.notify(
      permission === 'granted' ? 'Notificações de novas missões ativadas.' : 'Permissão de notificação não concedida.',
      permission === 'granted' ? 'success' : 'warning'
    );
  };

  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">EXECUÇÃO EM CAMPO</span>
        <h1>Tarefas / Missões</h1>
        <p>Missões já recebidas permanecem disponíveis sem internet.</p>
      </div>

      <div className="mission-toolbar">
        <button className="button secondary" onClick={enableNotifications}>ATIVAR NOTIFICAÇÕES</button>
        <label className="tracking-toggle">
          <input
            type="checkbox"
            checked={runtime.locationTracking}
            onChange={event => runtime.setLocationTracking(event.target.checked)}
          />
          <span>
            <strong>Mapa da Equipe</strong>
            <small>Compartilhar localização operacional enquanto online e com permissão.</small>
          </span>
        </label>
      </div>

      {editing ? (
        <div className="form-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{editing.completed ? 'MISSÃO CONCLUÍDA' : 'EXECUTAR MISSÃO'}</span>
              <h2>{editing.title}</h2>
            </div>
            <button className="text-button" onClick={() => setEditing(null)}>Voltar</button>
          </div>
          {editing.description && <p>{editing.description}</p>}
          <label className="field">
            <span>Observações</span>
            <textarea
              className="input textarea"
              disabled={editing.completed}
              value={notes}
              onChange={event => setNotes(event.target.value)}
            />
          </label>
          {!editing.completed && (
            <>
              <label className="field">
                <span>Fotos / evidências</span>
                <input
                  className="input file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={async event => setEvidence(await filesToDataUrls(event.target.files))}
                />
              </label>
              <button className="button secondary" onClick={captureLocation}>
                {location ? 'LOCALIZAÇÃO REGISTRADA' : 'REGISTRAR LOCALIZAÇÃO'}
              </button>
              <button className="button primary" onClick={complete}>CONCLUIR MISSÃO</button>
            </>
          )}
          {editing.pendingReturn && <div className="pending-banner">Retorno pendente de transmissão automática.</div>}
        </div>
      ) : (
        <div className="list-cards">
          {missions.map(mission => (
            <button className="mission-card" key={mission.id} onClick={() => open(mission)}>
              <div>
                <span className={mission.completed ? 'status-pill done' : 'status-pill'}>{mission.completed ? 'Concluída' : 'Pendente'}</span>
                <strong>{mission.title}</strong>
                <span>{mission.description ?? 'Sem descrição adicional.'}</span>
              </div>
              {mission.pendingReturn && <span className="pending-label">Retorno pendente</span>}
            </button>
          ))}
          {missions.length === 0 && (
            <div className="empty-state">
              <strong>Nenhuma missão recebida</strong>
              <p>Novas missões podem chegar automaticamente quando houver internet.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
