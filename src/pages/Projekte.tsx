import { useState } from "react";
import { Plus, Pencil, Building2, FolderOpen, X } from "lucide-react";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import type { Client, Project } from "../store/types";

export function Projekte() {
  const { state, dispatch } = useApp();
  const [clientModal, setClientModal] = useState<Client | null>(null);
  const [projectModal, setProjectModal] = useState<Project | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const [clientForm, setClientForm] = useState<Omit<Client, "id">>({
    name: "",
    contactPerson: "",
    street: "",
    zip: "",
    city: "",
    salutation: "",
  });
  const [projectForm, setProjectForm] = useState<Omit<Project, "id">>({
    clientId: state.clients[0]?.id || "",
    name: "",
    description: "",
    active: true,
    commonTasks: [],
  });
  const [newTaskInput, setNewTaskInput] = useState("");

  const openEditClient = (c: Client) => {
    setClientForm({
      name: c.name,
      contactPerson: c.contactPerson,
      street: c.street,
      zip: c.zip,
      city: c.city,
      salutation: c.salutation,
    });
    setClientModal(c);
  };

  const saveClient = () => {
    if (clientModal) {
      dispatch({
        type: "UPDATE_CLIENT",
        client: { ...clientModal, ...clientForm },
      });
      setClientModal(null);
    } else {
      dispatch({
        type: "ADD_CLIENT",
        client: { id: crypto.randomUUID(), ...clientForm },
      });
      setShowNewClient(false);
    }
    setClientForm({
      name: "",
      contactPerson: "",
      street: "",
      zip: "",
      city: "",
      salutation: "",
    });
  };

  const openEditProject = (p: Project) => {
    setProjectForm({
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      active: p.active,
      commonTasks: p.commonTasks || [],
    });
    setNewTaskInput("");
    setProjectModal(p);
  };

  const saveProject = () => {
    if (projectModal) {
      dispatch({
        type: "UPDATE_PROJECT",
        project: { ...projectModal, ...projectForm },
      });
      setProjectModal(null);
    } else {
      dispatch({
        type: "ADD_PROJECT",
        project: { id: crypto.randomUUID(), ...projectForm },
      });
      setShowNewProject(false);
    }
    setProjectForm({
      clientId: state.clients[0]?.id || "",
      name: "",
      description: "",
      active: true,
      commonTasks: [],
    });
    setNewTaskInput("");
  };

  const clientFormFields = (
    <div className="space-y-3">
      <Input
        label="Firmenname"
        value={clientForm.name}
        onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Kontaktperson"
        value={clientForm.contactPerson}
        onChange={(e) =>
          setClientForm((f) => ({ ...f, contactPerson: e.target.value }))
        }
      />
      <Input
        label="Anrede"
        value={clientForm.salutation}
        onChange={(e) =>
          setClientForm((f) => ({ ...f, salutation: e.target.value }))
        }
        placeholder="z.B. Sehr geehrter Herr Dr. Vondung"
      />
      <Input
        label="Straße"
        value={clientForm.street}
        onChange={(e) =>
          setClientForm((f) => ({ ...f, street: e.target.value }))
        }
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label="PLZ"
          value={clientForm.zip}
          onChange={(e) =>
            setClientForm((f) => ({ ...f, zip: e.target.value }))
          }
        />
        <div className="col-span-2">
          <Input
            label="Ort"
            value={clientForm.city}
            onChange={(e) =>
              setClientForm((f) => ({ ...f, city: e.target.value }))
            }
          />
        </div>
      </div>
      <Button onClick={saveClient}>
        {clientModal ? "Speichern" : "Hinzufügen"}
      </Button>
    </div>
  );

  const projectFormFields = (
    <div className="space-y-3">
      <Input
        label="Projektname"
        value={projectForm.name}
        onChange={(e) =>
          setProjectForm((f) => ({ ...f, name: e.target.value }))
        }
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-600">
          Kunde
        </label>
        <select
          value={projectForm.clientId}
          onChange={(e) =>
            setProjectForm((f) => ({ ...f, clientId: e.target.value }))
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          {state.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-stone-600">
          Beschreibung
        </label>
        <textarea
          value={projectForm.description}
          onChange={(e) =>
            setProjectForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={2}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-600">
          Häufige Arbeiten
        </label>
        <div className="flex flex-wrap gap-1.5">
          {projectForm.commonTasks.map((task, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700"
            >
              {task}
              <button
                type="button"
                onClick={() =>
                  setProjectForm((f) => ({
                    ...f,
                    commonTasks: f.commonTasks.filter((_, idx) => idx !== i),
                  }))
                }
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTaskInput.trim()) {
                e.preventDefault();
                setProjectForm((f) => ({
                  ...f,
                  commonTasks: [...f.commonTasks, newTaskInput.trim()],
                }));
                setNewTaskInput("");
              }
            }}
            placeholder="Neue Aufgabe + Enter"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (newTaskInput.trim()) {
                setProjectForm((f) => ({
                  ...f,
                  commonTasks: [...f.commonTasks, newTaskInput.trim()],
                }));
                setNewTaskInput("");
              }
            }}
            className="px-2.5 py-1.5 text-sm rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={projectForm.active}
          onChange={(e) =>
            setProjectForm((f) => ({ ...f, active: e.target.checked }))
          }
          className="rounded"
        />
        Aktiv
      </label>
      <Button onClick={saveProject}>
        {projectModal ? "Speichern" : "Hinzufügen"}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Projekte & Kunden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <Building2 size={18} /> Kunden
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setClientModal(null);
                setShowNewClient(true);
              }}
            >
              <Plus size={14} /> Neu
            </Button>
          </div>
          <div className="space-y-3">
            {state.clients.map((c) => (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-stone-800">{c.name}</p>
                    <p className="text-sm text-stone-500">{c.contactPerson}</p>
                    <p className="text-sm text-stone-500">
                      {c.street}, {c.zip} {c.city}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditClient(c)}
                      className="p-1.5 hover:bg-stone-100 rounded transition-colors"
                    >
                      <Pencil size={14} className="text-stone-500" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <FolderOpen size={18} /> Projekte
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setProjectModal(null);
                setShowNewProject(true);
              }}
            >
              <Plus size={14} /> Neu
            </Button>
          </div>
          <div className="space-y-3">
            {state.projects.map((p) => {
              const client = state.clients.find((c) => c.id === p.clientId);
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-800">{p.name}</p>
                        {!p.active && (
                          <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-500">{client?.name}</p>
                      <p className="text-sm text-stone-400">{p.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditProject(p)}
                        className="p-1.5 hover:bg-stone-100 rounded transition-colors"
                      >
                        <Pencil size={14} className="text-stone-500" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        open={showNewClient || !!clientModal}
        onClose={() => {
          setShowNewClient(false);
          setClientModal(null);
        }}
        title={clientModal ? "Kunde bearbeiten" : "Neuer Kunde"}
      >
        {clientFormFields}
      </Modal>

      <Modal
        open={showNewProject || !!projectModal}
        onClose={() => {
          setShowNewProject(false);
          setProjectModal(null);
        }}
        title={projectModal ? "Projekt bearbeiten" : "Neues Projekt"}
      >
        {projectFormFields}
      </Modal>
    </div>
  );
}
