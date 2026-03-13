import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Building2,
  FolderOpen,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  EyeOff,
  Eye,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { NumberInput } from "../components/common/NumberInput";
import { Modal } from "../components/common/Modal";
import type { Client, Project } from "../store/types";

export function Projekte() {
  const { state, dispatch } = useApp();
  const [clientModal, setClientModal] = useState<Client | null>(null);
  const [projectModal, setProjectModal] = useState<Project | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    () => new Set(state.clients.map((c) => c.id)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

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
    hourlyRate: 35,
    weeklyTarget: 28.5,
    weeklyCap: 1000,
    vatRate: 0.19,
    paymentTerms: 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
  });
  const [newTaskInput, setNewTaskInput] = useState("");

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const projectsByClient = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of state.projects) {
      if (!showInactive && !p.active) continue;
      const list = map.get(p.clientId) || [];
      list.push(p);
      map.set(p.clientId, list);
    }
    return map;
  }, [state.projects, showInactive]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return state.clients;
    const q = searchQuery.toLowerCase();
    return state.clients.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.contactPerson.toLowerCase().includes(q)) return true;
      const projects = projectsByClient.get(c.id) || [];
      return projects.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    });
  }, [state.clients, searchQuery, projectsByClient]);

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
      const newId = crypto.randomUUID();
      dispatch({
        type: "ADD_CLIENT",
        client: { id: newId, ...clientForm },
      });
      setExpandedClients((prev) => new Set(prev).add(newId));
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

  const openNewProjectForClient = (clientId: string) => {
    setProjectForm({
      clientId,
      name: "",
      description: "",
      active: true,
      commonTasks: [],
      hourlyRate: 35,
      weeklyTarget: 28.5,
      weeklyCap: 1000,
      vatRate: 0.19,
      paymentTerms: 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
    });
    setNewTaskInput("");
    setShowNewProject(true);
  };

  const openEditProject = (p: Project) => {
    setProjectForm({
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      active: p.active,
      commonTasks: p.commonTasks || [],
      hourlyRate: p.hourlyRate ?? 35,
      weeklyTarget: p.weeklyTarget ?? 28.5,
      weeklyCap: p.weeklyCap ?? 1000,
      vatRate: p.vatRate ?? 0.19,
      paymentTerms: p.paymentTerms ?? 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
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
      hourlyRate: 35,
      weeklyTarget: 28.5,
      weeklyCap: 1000,
      vatRate: 0.19,
      paymentTerms: 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
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
      <div className="pt-2 border-t border-stone-200">
        <label className="block text-sm font-medium text-stone-600 mb-3">
          Konditionen
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="Stundenlohn (€)"
              value={projectForm.hourlyRate}
              onValueChange={(v) =>
                setProjectForm((f) => ({ ...f, hourlyRate: v }))
              }
              decimals={2}
            />
            <NumberInput
              label="Wochenstunden"
              value={projectForm.weeklyTarget}
              onValueChange={(v) =>
                setProjectForm((f) => ({ ...f, weeklyTarget: v }))
              }
            />
            <NumberInput
              label="Wochenlimit (€)"
              value={projectForm.weeklyCap}
              onValueChange={(v) =>
                setProjectForm((f) => ({ ...f, weeklyCap: v }))
              }
              decimals={0}
            />
          </div>
          <NumberInput
            label="USt-Satz (%)"
            value={Math.round(projectForm.vatRate * 100)}
            onValueChange={(v) =>
              setProjectForm((f) => ({ ...f, vatRate: v / 100 }))
            }
            decimals={0}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-stone-600">
              Zahlungsbedingungen
            </label>
            <textarea
              value={projectForm.paymentTerms}
              onChange={(e) =>
                setProjectForm((f) => ({ ...f, paymentTerms: e.target.value }))
              }
              rows={2}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
            />
          </div>
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
      <PageHeader title="Projekte & Kunden">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setClientModal(null);
            setClientForm({
              name: "",
              contactPerson: "",
              street: "",
              zip: "",
              city: "",
              salutation: "",
            });
            setShowNewClient(true);
          }}
        >
          <Building2 size={14} /> Neuer Kunde
        </Button>
      </PageHeader>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kunde oder Projekt suchen…"
            className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            showInactive
              ? "bg-stone-800 text-white"
              : "bg-white text-stone-500 border border-stone-300 hover:bg-stone-50"
          }`}
          title={showInactive ? "Inaktive ausblenden" : "Inaktive anzeigen"}
        >
          {showInactive ? <Eye size={14} /> : <EyeOff size={14} />}
          <span className="hidden sm:inline">Inaktive</span>
        </button>
      </div>

      {/* Client Accordion List */}
      <div className="space-y-3">
        {filteredClients.map((client) => {
          const isExpanded = expandedClients.has(client.id);
          const projects = projectsByClient.get(client.id) || [];
          const activeCount = state.projects.filter(
            (p) => p.clientId === client.id && p.active,
          ).length;
          const totalCount = state.projects.filter(
            (p) => p.clientId === client.id,
          ).length;

          // When searching, highlight matching projects
          const q = searchQuery.toLowerCase().trim();
          const filteredProjects = q
            ? projects.filter(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  p.description.toLowerCase().includes(q) ||
                  client.name.toLowerCase().includes(q) ||
                  client.contactPerson.toLowerCase().includes(q),
              )
            : projects;

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
            >
              {/* Client Header */}
              <button
                onClick={() => toggleClient(client.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
              >
                <span className="text-stone-400">
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </span>
                <Building2 size={16} className="text-stone-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 truncate">
                      {client.name}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 truncate">
                    {client.contactPerson}
                    {client.contactPerson && totalCount > 0 && " · "}
                    {totalCount > 0 && (
                      <span>
                        {activeCount}{" "}
                        {activeCount === 1 ? "Projekt" : "Projekte"}
                        {!showInactive && totalCount > activeCount && (
                          <span className="text-stone-400">
                            {" "}
                            (+{totalCount - activeCount} inaktiv)
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditClient(client);
                  }}
                  className="p-1.5 hover:bg-stone-200 rounded transition-colors shrink-0"
                >
                  <Pencil size={14} className="text-stone-400" />
                </span>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-4">
                  {/* Address line */}
                  {(client.street || client.city) && (
                    <p className="text-xs text-stone-400 mb-3 ml-9">
                      {client.street}
                      {client.street && client.city && ", "}
                      {client.zip} {client.city}
                    </p>
                  )}

                  {/* Projects */}
                  <div className="ml-9 space-y-2">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                          project.active
                            ? "border-stone-200 bg-stone-50/50"
                            : "border-stone-100 bg-stone-50/30 opacity-60"
                        }`}
                      >
                        <FolderOpen
                          size={15}
                          className="text-stone-400 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-700 text-sm">
                              {project.name}
                            </span>
                            {!project.active && (
                              <span className="text-[11px] px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded">
                                Inaktiv
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                              {project.description}
                            </p>
                          )}
                          {project.commonTasks?.length > 0 && (
                            <p className="text-xs text-stone-400 mt-1">
                              {project.commonTasks.length}{" "}
                              {project.commonTasks.length === 1
                                ? "Aufgabe"
                                : "Aufgaben"}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => openEditProject(project)}
                          className="p-1 hover:bg-stone-200 rounded transition-colors shrink-0"
                        >
                          <Pencil size={13} className="text-stone-400" />
                        </button>
                      </div>
                    ))}

                    {/* Empty state */}
                    {filteredProjects.length === 0 && !q && (
                      <p className="text-sm text-stone-400 py-2">
                        Noch keine Projekte
                      </p>
                    )}

                    {/* Add project button */}
                    <button
                      onClick={() => openNewProjectForClient(client.id)}
                      className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 py-2 transition-colors"
                    >
                      <Plus size={14} />
                      Neues Projekt
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {filteredClients.length === 0 && searchQuery && (
          <div className="text-center py-12 text-stone-400">
            <Search size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Kein Ergebnis für &bdquo;{searchQuery}&ldquo;
            </p>
          </div>
        )}

        {filteredClients.length === 0 && !searchQuery && (
          <div className="text-center py-12 text-stone-400">
            <Building2 size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Noch keine Kunden angelegt</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => {
                setClientModal(null);
                setClientForm({
                  name: "",
                  contactPerson: "",
                  street: "",
                  zip: "",
                  city: "",
                  salutation: "",
                });
                setShowNewClient(true);
              }}
            >
              <Plus size={14} /> Ersten Kunden anlegen
            </Button>
          </div>
        )}
      </div>

      {/* Client Modal */}
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

      {/* Project Modal */}
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
