import re

file_path = "h:/Aplicaciones/flip-v2/apps/web/src/features/reservations/components/reservation-dialog.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace everything starting from the specific comment "{/* Purpose (All but workshop title) */}"
# to the end of the Left Sidebar and beginning of Right Sidebar to guarantee clean HTML closing tags.
pattern = re.compile(r'\{\/\* Purpose \(All but workshop title\) \*\/\}.*?\{\/\* Right Side - Weekly Calendar \*\/\}\s*', re.DOTALL)

replacement = """{/* Purpose (All but workshop title) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400 tracking-wide block">
                                            Propósito (opcional)
                                        </label>
                                        <Textarea
                                            placeholder={reservationType === 'learning'
                                                ? "Ej: Clase de robótica..."
                                                : reservationType === 'workshop'
                                                    ? "Ej: Taller práctico con docentes..."
                                                    : "Ej: Reunión de coordinadores..."
                                            }
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            rows={2}
                                            className="bg-slate-50 border-slate-200 focus-visible:ring-primary/20 rounded-xl resize-none text-sm shadow-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Weekly Calendar */}
"""

new_content = pattern.sub(replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)
