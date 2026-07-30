module.exports = {
    GRUPO_ID: 17092196,

    // Mapeamento RANK -> NOME
    RANK_CARGOS: {
        0:   { nome: "[CI] Cidadão",                cor: 0x808080 },
        1:   { nome: "[REC] Recruta",                cor: 0x00FF00 },
        2:   { nome: "[SLD] Soldado",                cor: 0x00FF00 },
        3:   { nome: "[CB] Cabo",                    cor: 0x00FF00 },
        4:   { nome: "[3º SGT] Terceiro-Sargento",    cor: 0xFF69B4 },
        5:   { nome: "[2º SGT] Segundo-Sargento",     cor: 0xFF69B4 },
        6:   { nome: "[1º SGT] Primeiro-Sargento",    cor: 0xFF69B4 },
        7:   { nome: "[ST] Subtenente",               cor: 0xFF69B4 },
        8:   { nome: "[CT] Cadete",                   cor: 0x800000 },
        9:   { nome: "[ASP] Aspirante a Oficial",     cor: 0x800000 },
        10:  { nome: "[2º TEN] Segundo-Tenente",      cor: 0x800000 },
        11:  { nome: "[1º TEN] Primeiro-Tenente",     cor: 0x800000 },
        12:  { nome: "[CAP] Capitão",                 cor: 0x800000 },
        13:  { nome: "[MAJ] Major",                   cor: 0x800000 },
        14:  { nome: "[TC] Tenente-Coronel",          cor: 0x800000 },
        15:  { nome: "[CEL] Coronel",                 cor: 0x800000 },
        16:  { nome: "[GEN BDA] General de Brigada",   cor: 0x800000 },
        17:  { nome: "[GEN DIV] General de Divisão",   cor: 0x800000 },
        18:  { nome: "[GEN EX] General de Exército",   cor: 0x800000 },
        19:  { nome: "[SCMT] Subcomandante",           cor: 0x8B0000 },
        20:  { nome: "[CMT] Comandante",               cor: 0x8B0000 },
        21:  { nome: "[V-PRES] Vice-Presidente",       cor: 0xFFFF00 },
        22:  { nome: "[PRES] Presidente",              cor: 0xFFFF00 },
        23:  { nome: "[SC] Sócio",                    cor: 0x800080 },
        24:  { nome: "[SCR] Subcriador",              cor: 0x800080 },
        25:  { nome: "[SUP-A] Supervisor Administrativo", cor: 0x0000FF },
        26:  { nome: "[MOD] Moderador",               cor: 0x0000FF },
        27:  { nome: "[ADM] Administrador",           cor: 0x0000FF },
        28:  { nome: "[ADM-G] Administrador Geral",   cor: 0x0000FF },
        255: { nome: "[CR] Criador",                  cor: 0x8B0000 }
    },

    // Mapeamento NOME -> RANK (usado por /promover e /rebaixar)
    RANK_POR_NOME: {
        "[CI] Cidadão": 0,
        "[REC] Recruta": 1,
        "[SLD] Soldado": 2,
        "[CB] Cabo": 3,
        "[3º SGT] Terceiro-Sargento": 4,
        "[2º SGT] Segundo-Sargento": 5,
        "[1º SGT] Primeiro-Sargento": 6,
        "[ST] Subtenente": 7,
        "[CT] Cadete": 8,
        "[ASP] Aspirante a Oficial": 9,
        "[2º TEN] Segundo-Tenente": 10,
        "[1º TEN] Primeiro-Tenente": 11,
        "[CAP] Capitão": 12,
        "[MAJ] Major": 13,
        "[TC] Tenente-Coronel": 14,
        "[CEL] Coronel": 15,
        "[GEN BDA] General de Brigada": 16,
        "[GEN DIV] General de Divisão": 17,
        "[GEN EX] General de Exército": 18,
        "[SCMT] Subcomandante": 19,
        "[CMT] Comandante": 20,
        "[V-PRES] Vice-Presidente": 21,
        "[PRES] Presidente": 22,
        "[SC] Sócio": 23,
        "[SCR] Subcriador": 24,
        "[SUP-A] Supervisor Administrativo": 25,
        "[MOD] Moderador": 26,
        "[ADM] Administrador": 27,
        "[ADM-G] Administrador Geral": 28,
        "[CR] Criador": 255,
    },

    // Times base
    TIMES_BASE: {
        "Cidadão":   { nome: "[CI] Cidadão",    cor: 0x808080 },
        "Praças":    { nome: "[PR] Praças",     cor: 0x00FF00 },
        "Graduados": { nome: "[GD] Graduados",  cor: 0xFF69B4 },
        "Oficiais":  { nome: "[OF] Oficiais",   cor: 0x800000 }
    },

    // Divisões
    DIVISOES: {
        "CIE":  { nome: "[CIE] Centro de Inteligência do Exército", cor: 0x000000 },
        "PE":   { nome: "[PE] Polícia do Exército",                cor: 0xFF0000 },
        "BAC":  { nome: "[BAC] Batalhão de Ações de Comandos",      cor: 0x8B0000 },
        "BFE":  { nome: "[BFE] Batalhão de Forças Especiais",       cor: 0x000000 },
        "BIP":  { nome: "[BIP] Batalhão de Infantaria",             cor: 0x006400 },
        "AVEX": { nome: "[AVEX] Aviação do Exército",                cor: 0x0000FF },
        "PQD":  { nome: "[PQD] Brigada de Infantaria Paraquedista",  cor: 0xFF8C00 },
        "GOV":  { nome: "[GOV] Governo",                            cor: 0xFFFF00 }
    },

    // TODAS AS CATEGORIAS E CANAIS (INCLUI AS DIVISÕES E SUPORTE)
    CATEGORIAS: [
        {
            nome: "📋 INFORMAÇÕES",
            canais: [
                {
                    nome: "📢-avisos",
                    tipo: "GUILD_TEXT",
                    topico: "Avisos oficiais do quartel",
                    permissoes: {
                        everyone: { deny: ["SendMessages"] },
                        roles: {
                            "Staff": { allow: ["SendMessages"] },
                            "Administrador": { allow: ["SendMessages"] },
                            "[MOD] Moderador": { allow: ["SendMessages"] },
                            "[ADM] Administrador": { allow: ["SendMessages"] },
                            "[ADM-G] Administrador Geral": { allow: ["SendMessages"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["SendMessages"] },
                            "[CR] Criador": { allow: ["SendMessages"] }
                        }
                    }
                },
                {
                    nome: "📌-regras",
                    tipo: "GUILD_TEXT",
                    topico: "Regras do Exército Brasileiro",
                    permissoes: {
                        everyone: { deny: ["SendMessages"] },
                        roles: {
                            "Staff": { allow: ["SendMessages"] },
                            "Administrador": { allow: ["SendMessages"] }
                        }
                    }
                },
                {
                    nome: "🔗-links",
                    tipo: "GUILD_TEXT",
                    topico: "Links úteis",
                    permissoes: {
                        everyone: { deny: ["SendMessages"] },
                        roles: {
                            "Staff": { allow: ["SendMessages"] },
                            "Administrador": { allow: ["SendMessages"] }
                        }
                    }
                },
                {
                    nome: "🔗-verificação",
                    tipo: "GUILD_TEXT",
                    topico: "Painel de vinculação Roblox"
                }
            ]
        },
        {
            nome: "💬 CHAT GERAL",
            canais: [
                { nome: "💬-bate-papo", tipo: "GUILD_TEXT" },
                { nome: "🔊-voz-geral", tipo: "GUILD_VOICE" }
            ]
        },
        {
            nome: "👥 CIVIS",
            canais: [
                { nome: "💬-civil-chat", tipo: "GUILD_TEXT" },
                { nome: "🔊-civil-voz", tipo: "GUILD_VOICE" }
            ]
        },
        {
            nome: "🪖 PRAÇAS",
            canais: [
                {
                    nome: "💬-pracas-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PR] Praças": { allow: ["ViewChannel"] },
                            "[GD] Graduados": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-pracas-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PR] Praças": { allow: ["ViewChannel"] },
                            "[GD] Graduados": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "🎖️ GRADUADOS",
            canais: [
                {
                    nome: "💬-graduados-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[GD] Graduados": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-graduados-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[GD] Graduados": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "⭐ OFICIAIS",
            canais: [
                {
                    nome: "💬-oficiais-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-oficiais-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        // Divisões
        {
            nome: "[CIE] Centro de Inteligência do Exército",
            canais: [
                {
                    nome: "💬-cie-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-cie-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[CIE] Centro de Inteligência do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[PE] Polícia do Exército",
            canais: [
                {
                    nome: "💬-pe-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-pe-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PE] Polícia do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[BAC] Batalhão de Ações de Comandos",
            canais: [
                {
                    nome: "💬-bac-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-bac-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BAC] Batalhão de Ações de Comandos": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[BFE] Batalhão de Forças Especiais",
            canais: [
                {
                    nome: "💬-bfe-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-bfe-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BFE] Batalhão de Forças Especiais": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[BIP] Batalhão de Infantaria",
            canais: [
                {
                    nome: "💬-bip-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-bip-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[BIP] Batalhão de Infantaria": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[AVEX] Aviação do Exército",
            canais: [
                {
                    nome: "💬-avex-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-avex-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[AVEX] Aviação do Exército": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[PQD] Brigada de Infantaria Paraquedista",
            canais: [
                {
                    nome: "💬-pqd-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-pqd-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[PQD] Brigada de Infantaria Paraquedista": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "[GOV] Governo",
            canais: [
                {
                    nome: "💬-gov-chat",
                    tipo: "GUILD_TEXT",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                },
                {
                    nome: "🔊-gov-voz",
                    tipo: "GUILD_VOICE",
                    permissoes: {
                        everyone: { deny: ["ViewChannel"] },
                        roles: {
                            "[GOV] Governo": { allow: ["ViewChannel"] },
                            "Staff": { allow: ["ViewChannel"] },
                            "Administrador": { allow: ["ViewChannel"] },
                            "[OF] Oficiais": { allow: ["ViewChannel"] },
                            "[MOD] Moderador": { allow: ["ViewChannel"] },
                            "[ADM] Administrador": { allow: ["ViewChannel"] },
                            "[ADM-G] Administrador Geral": { allow: ["ViewChannel"] },
                            "[SUP-A] Supervisor Administrativo": { allow: ["ViewChannel"] },
                            "[CR] Criador": { allow: ["ViewChannel"] }
                        }
                    }
                }
            ]
        },
        {
            nome: "🎫 SUPORTE",
            canais: [
                {
                    nome: "🎫-tickets",
                    tipo: "GUILD_TEXT",
                    topico: "Abra um ticket para falar com a administração"
                }
            ]
        }
    ],

    CARGOS_BASE: [
        { nome: "Staff", cor: 0x00FFFF, permissions: ["ManageMessages", "KickMembers"] },
        { nome: "Administrador", cor: 0xFF0000, permissions: ["Administrator"] }
    ],

    VERIFICACAO_PREFIX: "",
    ROBLOX_API: "https://users.roblox.com/v1",
    ROBLOX_GROUPS_API: "https://groups.roblox.com/v1"
};
