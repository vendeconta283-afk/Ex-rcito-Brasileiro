require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const config = require('./config');

// ================= CONEXÃO MONGODB =================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch(err => console.error('❌ Erro MongoDB:', err));

const VerificationSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    robloxId: Number,
    username: String,
    code: String,
    step: String,
    lastGiro: Date,
    ultimoPremio: String,
});
const VerificationModel = mongoose.model('Verification', VerificationSchema);

// ================= CLIENT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= FUNÇÕES AUXILIARES =================
async function getRobloxUserByName(username) {
    const res = await fetch(`${config.ROBLOX_API}/usernames/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.length > 0 ? data.data[0] : null;
}

async function getRobloxUserById(userId) {
    const res = await fetch(`${config.ROBLOX_API}/users/${userId}`);
    if (!res.ok) return null;
    return await res.json();
}

async function getRobloxUserGroups(userId) {
    const res = await fetch(`${config.ROBLOX_GROUPS_API}/users/${userId}/groups/roles`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
}

async function checkBioForCode(userId, code) {
    const user = await getRobloxUserById(userId);
    if (!user || !user.description) return false;
    return user.description.includes(code);
}

function gerarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getPatenteAbreviacao(nomePatente) {
    const match = nomePatente.match(/^(\[.+\])/);
    return match ? match[1] : nomePatente;
}

function getTimeBase(patenteNome) {
    if (!patenteNome) return config.TIMES_BASE["Cidadão"];
    if (patenteNome.includes("V-PRES") || patenteNome.includes("PRES")) return config.TIMES_BASE["Oficiais"];
    const pracas = ["[REC] Recruta", "[SLD] Soldado", "[CB] Cabo"];
    const graduados = ["[3º SGT] Terceiro-Sargento", "[2º SGT] Segundo-Sargento", "[1º SGT] Primeiro-Sargento", "[ST] Subtenente"];
    if (pracas.includes(patenteNome)) return config.TIMES_BASE["Praças"];
    if (graduados.includes(patenteNome)) return config.TIMES_BASE["Graduados"];
    if (patenteNome === "[CI] Cidadão") return config.TIMES_BASE["Cidadão"];
    return config.TIMES_BASE["Oficiais"];
}

async function getOrCreateRole(guild, nome, corHex, permissions = []) {
    try {
        let role = guild.roles.cache.find(r => r.name === nome);
        if (!role) {
            role = await guild.roles.create({ name: nome, color: corHex, permissions });
        } else {
            if (role.color !== corHex) await role.setColor(corHex);
        }
        return role;
    } catch (e) {
        console.error(`❌ Falha ao criar cargo ${nome}:`, e.message);
        return null;
    }
}

async function aplicarCargos(member, rank, patenteNome, robloxUsername) {
    const guild = member.guild;
    const cargoPatente = config.RANK_CARGOS[rank] || config.RANK_CARGOS[0];
    const rolePatente = await getOrCreateRole(guild, cargoPatente.nome, cargoPatente.cor);
    const timeInfo = getTimeBase(patenteNome);
    const roleTime = await getOrCreateRole(guild, timeInfo.nome, timeInfo.cor);
    if (!rolePatente || !roleTime) return;

    const nomesPatentes = Object.values(config.RANK_CARGOS).map(c => c.nome);
    const nomesTimes = Object.values(config.TIMES_BASE).map(t => t.nome);
    const nomesDivisoes = Object.values(config.DIVISOES).map(d => d.nome);

    const cargosParaRemover = member.roles.cache.filter(r =>
        (nomesPatentes.includes(r.name) || nomesTimes.includes(r.name)) &&
        r.id !== rolePatente.id &&
        r.id !== roleTime.id
    );

    const divisaoAtual = member.roles.cache.find(r => nomesDivisoes.includes(r.name));

    try {
        if (cargosParaRemover.size > 0) await member.roles.remove(cargosParaRemover);
        await member.roles.add([rolePatente, roleTime]);
        if (divisaoAtual) await member.roles.add(divisaoAtual);
    } catch (err) {
        console.error("Erro ao aplicar cargos:", err);
    }

    const abreviacao = getPatenteAbreviacao(cargoPatente.nome);
    const novoNick = `${abreviacao} ${robloxUsername}`;
    try {
        await member.setNickname(novoNick);
    } catch (e) {
        console.warn(`Não foi possível alterar o nick de ${member.user.tag}: ${e.message}`);
    }
}

function isModOrHigher(member) {
    if (member.id === member.guild.ownerId) return true;
    const cargosMod = [
        "Administrador",
        "Staff",
        "[MOD] Moderador",
        "[ADM] Administrador",
        "[ADM-G] Administrador Geral",
        "[SUP-A] Supervisor Administrativo",
        "[CR] Criador"
    ];
    return member.roles.cache.some(role => cargosMod.includes(role.name));
}

async function getRobloxIdFromDiscord(discordId) {
    const data = await VerificationModel.findOne({ discordId, step: 'done' });
    return data ? data.robloxId : null;
}

async function isAspiranteOrHigher(member) {
    const robloxId = await getRobloxIdFromDiscord(member.id);
    if (!robloxId) return false;
    const groups = await getRobloxUserGroups(robloxId);
    const grupoEB = groups.find(g => g.group.id === config.GRUPO_ID);
    return grupoEB && grupoEB.role.rank >= 9;
}

async function getAutorRank(member) {
    const robloxId = await getRobloxIdFromDiscord(member.id);
    if (!robloxId) return 0;
    const groups = await getRobloxUserGroups(robloxId);
    const grupoEB = groups.find(g => g.group.id === config.GRUPO_ID);
    return grupoEB ? grupoEB.role.rank : 0;
}

async function getTargetRank(discordId) {
    const robloxId = await getRobloxIdFromDiscord(discordId);
    if (!robloxId) return 0;
    const groups = await getRobloxUserGroups(robloxId);
    const grupoEB = groups.find(g => g.group.id === config.GRUPO_ID);
    return grupoEB ? grupoEB.role.rank : 0;
}

// Nova função: obter token XSRF
async function getXSRFToken(cookie) {
    const res = await fetch('https://auth.roblox.com/v2/logout', {
        method: 'POST',
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    return res.headers.get('x-csrf-token');
}

// Nova função: postar no mural do grupo
async function postGroupWall(message) {
    const cookie = process.env.ROBLOX_COOKIE;
    if (!cookie) throw new Error('Cookie não configurado.');
    const xsrf = await getXSRFToken(cookie);
    const res = await fetch(`https://groups.roblox.com/v1/groups/${config.GRUPO_ID}/wall/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'x-csrf-token': xsrf
        },
        body: JSON.stringify({ body: message })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Erro ao postar no mural: ${res.status} ${err}`);
    }
    return true;
}

// Nova função: enviar comando via MessagingService
async function sendGameCommand(topic, data) {
    const cookie = process.env.ROBLOX_COOKIE;
    const universeId = process.env.UNIVERSE_ID;
    if (!cookie || !universeId) throw new Error('Variáveis ausentes.');
    const xsrf = await getXSRFToken(cookie);
    const res = await fetch(`https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${topic}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'x-csrf-token': xsrf
        },
        body: JSON.stringify({ message: JSON.stringify(data) })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Erro no MessagingService: ${res.status} ${err}`);
    }
    return true;
}

// Nova função: consultar inventário (exemplo: verifica se possui um item específico)
async function getUserInventory(userId, assetId) {
    const cookie = process.env.ROBLOX_COOKIE;
    if (!cookie) throw new Error('Cookie não configurado.');
    const xsrf = await getXSRFToken(cookie);
    const res = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${assetId}`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrf }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.data && data.data.length > 0;
}

// Nova função: ler DataStore ForcasBrasilData para top dinheiro
async function getTopDinheiro(limit = 10) {
    // Esta é uma simulação porque a API de listagem de DataStores não existe.
    // Precisaríamos de uma lista de todos os jogadores, o que não é viável.
    // Vou implementar usando a lista de membros do grupo.
    const cookie = process.env.ROBLOX_COOKIE;
    if (!cookie) throw new Error('Cookie não configurado.');
    const xsrf = await getXSRFToken(cookie);
    // Buscar membros do grupo (limitado a 100)
    const membersRes = await fetch(`https://groups.roblox.com/v1/groups/${config.GRUPO_ID}/members?limit=100`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrf }
    });
    if (!membersRes.ok) throw new Error('Não foi possível obter membros.');
    const membersData = await membersRes.json();
    const members = membersData.data;
    const universeId = process.env.UNIVERSE_ID;
    const top = [];
    for (const member of members.slice(0, 50)) {
        try {
            const getRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=ForcasBrasilData&entryKey=${member.user.userId}`, {
                headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrf }
            });
            if (getRes.ok) {
                const data = await getRes.json();
                const dinheiro = data.value?.Dinheiro || 0;
                top.push({ nome: member.user.username, dinheiro });
            }
        } catch (e) {}
    }
    top.sort((a, b) => b.dinheiro - a.dinheiro);
    return top.slice(0, limit);
}

// ================= COMANDOS =================
const criarCommand = new SlashCommandBuilder()
    .setName('criar')
    .setDescription('Apaga tudo e recria o servidor do zero (apenas admin)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

const painelCommand = new SlashCommandBuilder()
    .setName('painelverificacao')
    .setDescription('Envia o painel de vinculação Roblox neste canal')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const ticketCommand = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Envia o painel de suporte/compras')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const limparCommand = new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga mensagens (MOD+)')
    .addIntegerOption(option =>
        option.setName('quantidade').setDescription('Número de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    );

const modolentoCommand = new SlashCommandBuilder()
    .setName('modolento')
    .setDescription('Ativa/desativa o modo lento em um canal (MOD+)')
    .addChannelOption(option => option.setName('canal').setDescription('Canal para o modo lento').setRequired(true))
    .addIntegerOption(option => option.setName('segundos').setDescription('Tempo em segundos (0 para desativar)').setRequired(true).setMinValue(0).setMaxValue(21600));

const banCommand = new SlashCommandBuilder()
    .setName('banir')
    .setDescription('Bane um usuário (MOD+)')
    .addUserOption(option => option.setName('usuario').setDescription('Usuário a ser banido').setRequired(true))
    .addStringOption(option => option.setName('motivo').setDescription('Motivo do ban').setRequired(false));

const muteCommand = new SlashCommandBuilder()
    .setName('mutar')
    .setDescription('Muta um usuário (timeout) (MOD+)')
    .addUserOption(option => option.setName('usuario').setDescription('Usuário a ser mutado').setRequired(true))
    .addIntegerOption(option => option.setName('minutos').setDescription('Duração em minutos').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(option => option.setName('motivo').setDescription('Motivo do mute').setRequired(false));

const avisoCommand = new SlashCommandBuilder()
    .setName('aviso')
    .setDescription('Envia um aviso no canal (MOD+)')
    .addUserOption(option => option.setName('usuario').setDescription('Usuário que receberá o aviso').setRequired(true))
    .addStringOption(option => option.setName('mensagem').setDescription('Conteúdo do aviso').setRequired(true));

const promoverCommand = new SlashCommandBuilder()
    .setName('promover')
    .setDescription('Promove um usuário no grupo do Roblox (Aspirante Oficial+)')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário do Discord a ser promovido')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('cargo')
            .setDescription('Nome exato do cargo (ex: [REC] Recruta)')
            .setRequired(true)
            .setAutocomplete(true)
    );

const rebaixarCommand = new SlashCommandBuilder()
    .setName('rebaixar')
    .setDescription('Rebaixa um usuário no grupo do Roblox (Aspirante Oficial+)')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário do Discord a ser rebaixado')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('cargo')
            .setDescription('Nome exato do cargo (ex: [REC] Recruta)')
            .setRequired(true)
            .setAutocomplete(true)
    );

const comprarPatenteCommand = new SlashCommandBuilder()
    .setName('comprarpatente')
    .setDescription('Gera a tabela de compra de patentes (Sócio+)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const giroCommand = new SlashCommandBuilder()
    .setName('giro')
    .setDescription('Gire a roleta e ganhe um prêmio aleatório (1 vez por dia)');

const restGiroCommand = new SlashCommandBuilder()
    .setName('restgiro')
    .setDescription('Reseta o cooldown do /giro de um usuário (Apenas Criador)')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário para resetar o giro')
            .setRequired(true)
    );

// Novos comandos
const anuncioMuralCommand = new SlashCommandBuilder()
    .setName('anunciomural')
    .setDescription('Posta uma mensagem no mural do grupo (Sócio+)')
    .addStringOption(option =>
        option.setName('mensagem')
            .setDescription('Texto a ser postado')
            .setRequired(true)
    );

const comandoJogoCommand = new SlashCommandBuilder()
    .setName('comandojogo')
    .setDescription('Envia um comando ao jogo via MessagingService (Admin+)')
    .addStringOption(option =>
        option.setName('comando')
            .setDescription('Comando (ex: "shutdown")')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('dados')
            .setDescription('Dados adicionais em JSON (opcional)')
            .setRequired(false)
    );

const inventarioCommand = new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('Verifica se um jogador possui um item específico')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário a ser verificado')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('itemid')
            .setDescription('ID do item (GamePass ou Asset)')
            .setRequired(true)
    );

const sorteioCommand = new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('Sorteia um prêmio entre os vinculados (Sócio+)')
    .addStringOption(option =>
        option.setName('premio')
            .setDescription('Descrição do prêmio')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('tipo')
            .setDescription('Tipo de prêmio')
            .setRequired(true)
            .addChoices(
                { name: 'Dinheiro', value: 'dinheiro' },
                { name: 'VIP', value: 'vip' }
            )
    )
    .addIntegerOption(option =>
        option.setName('valor')
            .setDescription('Quantidade (dinheiro) ou dias (VIP)')
            .setRequired(true)
    );

const topDinheiroCommand = new SlashCommandBuilder()
    .setName('topdinheiro')
    .setDescription('Exibe os 10 jogadores mais ricos (Sócio+)');

const banirJogoCommand = new SlashCommandBuilder()
    .setName('banirjogo')
    .setDescription('Bane um jogador do jogo (MOD+)')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário a ser banido do jogo')
            .setRequired(true)
    );

const desbanirJogoCommand = new SlashCommandBuilder()
    .setName('desbanirjogo')
    .setDescription('Remove o ban do jogo de um jogador (MOD+)')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuário a ser desbanido')
            .setRequired(true)
    );

// Registrar todos os comandos (incluindo os novos)
client.once('ready', async () => {
    console.log(`✅ Bot logado como ${client.user.tag}`);
    await client.application.commands.set([
        criarCommand, painelCommand, ticketCommand,
        limparCommand, modolentoCommand, banCommand, muteCommand, avisoCommand,
        promoverCommand, rebaixarCommand, comprarPatenteCommand, giroCommand, restGiroCommand,
        anuncioMuralCommand, comandoJogoCommand, inventarioCommand, sorteioCommand,
        topDinheiroCommand, banirJogoCommand, desbanirJogoCommand
    ]);
    console.log('📌 Comandos registrados.');

    // Painel de verificação automático
    client.guilds.cache.forEach(async (guild) => {
        const canal = guild.channels.cache.find(c => c.name === '🔗-verificação');
        if (canal) {
            const embed = new EmbedBuilder()
                .setTitle('🔗 VINCULAÇÃO ROBLOX')
                .setDescription('Clique no botão abaixo para vincular sua conta Roblox ao servidor.')
                .setColor(0x00AE86);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('btn_vincular').setLabel('Vincular Conta').setStyle(ButtonStyle.Primary).setEmoji('🔗'),
                    new ButtonBuilder().setCustomId('btn_sync').setLabel('Sincronizar').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
                    new ButtonBuilder().setCustomId('btn_guia').setLabel('Como Vincular').setStyle(ButtonStyle.Secondary).setEmoji('❓')
                );
            await canal.send({ embeds: [embed], components: [row] });
        }
    });
});

// Handler de interações expandido
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            const commandName = interaction.commandName;
            const member = interaction.member;
            // Comandos existentes...
            if (commandName === 'criar') {
                await handleCriar(interaction);
            } else if (commandName === 'painelverificacao') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                await handlePainel(interaction);
            } else if (commandName === 'ticket') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                await handleTicketPanel(interaction);
            } else if (commandName === 'limpar') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const quantidade = interaction.options.getInteger('quantidade');
                await interaction.channel.bulkDelete(quantidade, true);
                await interaction.reply({ content: `✅ ${quantidade} mensagens apagadas.`, ephemeral: true });
            } else if (commandName === 'modolento') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const canal = interaction.options.getChannel('canal');
                const segundos = interaction.options.getInteger('segundos');
                await canal.setRateLimitPerUser(segundos);
                await interaction.reply({ content: `✅ Modo lento em ${canal} definido para ${segundos} segundos.`, ephemeral: true });
            } else if (commandName === 'banir') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const usuario = interaction.options.getUser('usuario');
                const motivo = interaction.options.getString('motivo') || 'Não especificado';
                const targetMember = await interaction.guild.members.fetch(usuario.id).catch(() => null);
                if (!targetMember) return interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });
                if (!targetMember.bannable) return interaction.reply({ content: '❌ Não posso banir este usuário.', ephemeral: true });
                await targetMember.ban({ reason: motivo });
                await interaction.reply({ content: `✅ ${usuario.tag} banido. Motivo: ${motivo}`, ephemeral: true });
            } else if (commandName === 'mutar') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const usuario = interaction.options.getUser('usuario');
                const minutos = interaction.options.getInteger('minutos');
                const motivo = interaction.options.getString('motivo') || 'Não especificado';
                const targetMember = await interaction.guild.members.fetch(usuario.id).catch(() => null);
                if (!targetMember) return interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });
                if (!targetMember.moderatable) return interaction.reply({ content: '❌ Não posso mutar este usuário.', ephemeral: true });
                const ms = minutos * 60 * 1000;
                await targetMember.timeout(ms, motivo);
                await interaction.reply({ content: `✅ ${usuario.tag} mutado por ${minutos} minutos. Motivo: ${motivo}`, ephemeral: true });
            } else if (commandName === 'aviso') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const usuario = interaction.options.getUser('usuario');
                const mensagem = interaction.options.getString('mensagem');
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ AVISO')
                    .setDescription(`${usuario}, ${mensagem}`)
                    .setColor(0xff0000);
                await interaction.channel.send({ embeds: [embed] });
                await interaction.reply({ content: '✅ Aviso enviado.', ephemeral: true });
            } else if (commandName === 'promover') {
                await handlePromocao(interaction, 'promover');
            } else if (commandName === 'rebaixar') {
                await handlePromocao(interaction, 'rebaixar');
            } else if (commandName === 'comprarpatente') {
                await handleTabelaPatentes(interaction);
            } else if (commandName === 'giro') {
                await handleGirar(interaction);
            } else if (commandName === 'restgiro') {
                await handleRestGiro(interaction);
            }
            // ================= NOVOS COMANDOS =================
            else if (commandName === 'anunciomural') {
                const autorRank = await getAutorRank(member);
                if (autorRank < 23) return interaction.reply({ content: '❌ Apenas Sócio+ podem usar este comando.', ephemeral: true });
                const msg = interaction.options.getString('mensagem');
                await interaction.deferReply({ ephemeral: true });
                try {
                    await postGroupWall(msg);
                    await interaction.editReply('✅ Anúncio postado no mural do grupo!');
                    await logAction(interaction.guild, member.user, `Postou no mural: ${msg}`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro: ${err.message}`);
                }
            } else if (commandName === 'comandojogo') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const comando = interaction.options.getString('comando');
                const dados = interaction.options.getString('dados');
                await interaction.deferReply({ ephemeral: true });
                try {
                    const payload = dados ? JSON.parse(dados) : {};
                    await sendGameCommand(comando, payload);
                    await interaction.editReply(`✅ Comando "${comando}" enviado ao jogo.`);
                    await logAction(interaction.guild, member.user, `Enviou comando ao jogo: ${comando}`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro: ${err.message}`);
                }
            } else if (commandName === 'inventario') {
                const usuario = interaction.options.getUser('usuario');
                const itemId = interaction.options.getString('itemid');
                const robloxId = await getRobloxIdFromDiscord(usuario.id);
                if (!robloxId) return interaction.reply({ content: '❌ Usuário não vinculado ao Roblox.', ephemeral: true });
                await interaction.deferReply();
                try {
                    const possui = await getUserInventory(robloxId, itemId);
                    await interaction.editReply(`${usuario.tag} ${possui ? 'possui' : 'não possui'} o item \`${itemId}\`.`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro ao consultar inventário: ${err.message}`);
                }
            } else if (commandName === 'sorteio') {
                const autorRank = await getAutorRank(member);
                if (autorRank < 23) return interaction.reply({ content: '❌ Apenas Sócio+ podem usar este comando.', ephemeral: true });
                const premio = interaction.options.getString('premio');
                const tipo = interaction.options.getString('tipo');
                const valor = interaction.options.getInteger('valor');
                await interaction.deferReply();
                // Buscar todos os vinculados
                const allVerified = await VerificationModel.find({ step: 'done' });
                if (allVerified.length === 0) return interaction.editReply('❌ Nenhum usuário vinculado.');
                const sorteado = allVerified[Math.floor(Math.random() * allVerified.length)];
                const discordUser = await client.users.fetch(sorteado.discordId).catch(() => null);
                const nome = discordUser ? discordUser.tag : 'Desconhecido';
                // Entrega do prêmio
                try {
                    if (tipo === 'dinheiro') {
                        // Adicionar dinheiro ao DataStore
                        const cookie = process.env.ROBLOX_COOKIE;
                        const universeId = process.env.UNIVERSE_ID;
                        if (!cookie || !universeId) throw new Error('Variáveis ausentes.');
                        const xsrf = await getXSRFToken(cookie);
                        const getUrl = `https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=ForcasBrasilData&entryKey=${sorteado.robloxId}`;
                        const getRes = await fetch(getUrl, { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrf } });
                        let data = {};
                        if (getRes.ok) {
                            const json = await getRes.json();
                            data = json.value || {};
                        }
                        data.Dinheiro = (data.Dinheiro || 0) + valor;
                        const saveRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=ForcasBrasilData&entryKey=${sorteado.robloxId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Cookie': `.ROBLOSECURITY=${cookie}`,
                                'x-csrf-token': xsrf
                            },
                            body: JSON.stringify({ value: data })
                        });
                        if (!saveRes.ok) throw new Error('Falha ao salvar dinheiro.');
                    } else if (tipo === 'vip') {
                        const cookie = process.env.ROBLOX_COOKIE;
                        const universeId = process.env.UNIVERSE_ID;
                        const xsrf = await getXSRFToken(cookie);
                        const saveRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=VIP_Concedidos&entryKey=${sorteado.robloxId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Cookie': `.ROBLOSECURITY=${cookie}`,
                                'x-csrf-token': xsrf
                            },
                            body: JSON.stringify({ value: true })
                        });
                        if (!saveRes.ok) throw new Error('Falha ao conceder VIP.');
                    }
                    await interaction.editReply(`🎉 Sorteio: **${nome}** ganhou **${premio}**!`);
                    await logAction(interaction.guild, member.user, `Sorteou ${nome} com prêmio: ${premio}`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro na entrega: ${err.message}`);
                }
            } else if (commandName === 'topdinheiro') {
                const autorRank = await getAutorRank(member);
                if (autorRank < 23) return interaction.reply({ content: '❌ Apenas Sócio+ podem usar este comando.', ephemeral: true });
                await interaction.deferReply();
                try {
                    const top = await getTopDinheiro();
                    const embed = new EmbedBuilder()
                        .setTitle('💰 TOP 10 MAIS RICOS')
                        .setColor(0xffd700);
                    top.forEach((entry, index) => {
                        embed.addFields({ name: `${index+1}. ${entry.nome}`, value: `R$ ${entry.dinheiro.toLocaleString()}`, inline: false });
                    });
                    await interaction.editReply({ embeds: [embed] });
                } catch (err) {
                    await interaction.editReply(`❌ Erro: ${err.message}`);
                }
            } else if (commandName === 'banirjogo') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const usuario = interaction.options.getUser('usuario');
                const robloxId = await getRobloxIdFromDiscord(usuario.id);
                if (!robloxId) return interaction.reply({ content: '❌ Usuário não vinculado.', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                try {
                    const cookie = process.env.ROBLOX_COOKIE;
                    const universeId = process.env.UNIVERSE_ID;
                    const xsrf = await getXSRFToken(cookie);
                    const saveRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=BannedPlayers&entryKey=${robloxId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cookie': `.ROBLOSECURITY=${cookie}`,
                            'x-csrf-token': xsrf
                        },
                        body: JSON.stringify({ value: true })
                    });
                    if (!saveRes.ok) throw new Error('Falha ao banir.');
                    await interaction.editReply(`✅ ${usuario.tag} banido do jogo.`);
                    await logAction(interaction.guild, member.user, `Baniu do jogo: ${usuario.tag}`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro: ${err.message}`);
                }
            } else if (commandName === 'desbanirjogo') {
                if (!isModOrHigher(member)) return interaction.reply({ content: '❌ Apenas MOD+ podem usar este comando.', ephemeral: true });
                const usuario = interaction.options.getUser('usuario');
                const robloxId = await getRobloxIdFromDiscord(usuario.id);
                if (!robloxId) return interaction.reply({ content: '❌ Usuário não vinculado.', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                try {
                    const cookie = process.env.ROBLOX_COOKIE;
                    const universeId = process.env.UNIVERSE_ID;
                    const xsrf = await getXSRFToken(cookie);
                    // Deletar a entrada
                    const deleteRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=BannedPlayers&entryKey=${robloxId}`, {
                        method: 'DELETE',
                        headers: {
                            'Cookie': `.ROBLOSECURITY=${cookie}`,
                            'x-csrf-token': xsrf
                        }
                    });
                    if (!deleteRes.ok && deleteRes.status !== 404) throw new Error('Falha ao desbanir.');
                    await interaction.editReply(`✅ ${usuario.tag} desbanido do jogo.`);
                    await logAction(interaction.guild, member.user, `Removeu ban do jogo de: ${usuario.tag}`);
                } catch (err) {
                    await interaction.editReply(`❌ Erro: ${err.message}`);
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'btn_vincular') await startVerification(interaction);
            else if (interaction.customId === 'btn_sync') await handleSync(interaction);
            else if (interaction.customId === 'btn_guia') await showGuia(interaction);
            else if (interaction.customId === 'btn_verificar_bio') await checkBio(interaction);
            else if (interaction.customId === 'btn_ticket_suporte' || interaction.customId === 'btn_ticket_compra') {
                await criarTicket(interaction, interaction.customId === 'btn_ticket_compra');
            }
            else if (interaction.customId === 'btn_fechar_ticket') {
                await fecharTicket(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_nick') await handleNickSubmit(interaction);
        } else if (interaction.isAutocomplete()) {
            if (interaction.commandName === 'promover' || interaction.commandName === 'rebaixar') {
                const focused = interaction.options.getFocused();
                const choices = Object.keys(config.RANK_POR_NOME)
                    .filter(name => name.toLowerCase().includes(focused.toLowerCase()))
                    .slice(0, 25)
                    .map(name => ({ name, value: name }));
                await interaction.respond(choices);
            }
        }
    } catch (error) {
        console.error('Erro em interação:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', ephemeral: true }).catch(() => {});
        }
    }
});

// ================= FUNÇÕES DE LOG =================
async function logAction(guild, user, action) {
    const logChannel = guild.channels.cache.find(c => c.name === '📋-log');
    if (!logChannel) return;
    const embed = new EmbedBuilder()
        .setTitle('📋 LOG')
        .setDescription(`**${user.tag}** ${action}`)
        .setColor(0x00ff00)
        .setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
}

// ================= CRIAÇÃO DE TICKET =================
async function criarTicket(interaction, isCompra) {
    const guild = interaction.guild;
    const user = interaction.user;
    const tipo = isCompra ? 'compra' : 'suporte';

    const adminRole = guild.roles.cache.find(r => r.name === 'Administrador');
    const staffRole = guild.roles.cache.find(r => r.name === 'Staff');
    const modRole = guild.roles.cache.find(r => r.name === '[MOD] Moderador');

    const permissoes = [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ];
    if (adminRole) permissoes.push({ id: adminRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    if (staffRole) permissoes.push({ id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    if (modRole) permissoes.push({ id: modRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });

    try {
        const canal = await guild.channels.create({
            name: `ticket-${tipo}-${user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: permissoes,
        });

        let mensagemInicial = `🎫 **Ticket de ${tipo} aberto por ${user}**\n`;
        mensagemInicial += isCompra ? 'Descreva a patente que deseja comprar e um administrador irá atendê-lo.' : 'Descreva sua dúvida ou problema e aguarde o atendimento.';

        const closeBtn = new ButtonBuilder()
            .setCustomId('btn_fechar_ticket')
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const row = new ActionRowBuilder().addComponents(closeBtn);

        await canal.send({ content: mensagemInicial, components: [row] });
        await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });

        const ticketChannel = guild.channels.cache.find(c => c.name === '🎫-tickets');
        if (ticketChannel) {
            await ticketChannel.send(`📢 Novo ticket de ${tipo} criado por ${user}: ${canal}`);
        }
    } catch (err) {
        console.error('Erro ao criar ticket:', err);
        await interaction.reply({ content: '❌ Não foi possível criar o ticket. Verifique as permissões do bot.', ephemeral: true });
    }
}

// ================= FECHAR TICKET =================
async function fecharTicket(interaction) {
    const canal = interaction.channel;
    if (!canal.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Este comando só pode ser usado em canais de ticket.', ephemeral: true });
    }

    if (!isModOrHigher(interaction.member)) {
        return interaction.reply({ content: '❌ Apenas staff pode fechar tickets.', ephemeral: true });
    }

    await interaction.reply('🔒 Ticket fechado. O canal será deletado em 5 segundos...');
    setTimeout(async () => {
        try {
            await canal.delete();
        } catch (e) {
            console.error('Erro ao deletar canal:', e);
        }
    }, 5000);
}

// ================= /CRIAR =================
async function handleCriar(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Somente administradores.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const canal = interaction.channel;

    const log = async (msg) => {
        try { await canal.send(msg); } catch (e) { console.warn(e); }
    };

    try {
        await log('🔄 **Iniciando reconstrução do servidor...**');

        await log('🗑️ Removendo canais...');
        for (const c of [...guild.channels.cache.values()]) {
            try { await c.delete(); } catch (e) {}
        }
        await log('✅ Canais removidos.');

        await log('🗑️ Removendo cargos...');
        for (const [id, r] of guild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed)) {
            try { await r.delete(); } catch (e) {}
        }
        await log('✅ Cargos removidos.');

        await log('⚙️ Criando cargos base...');
        for (const c of config.CARGOS_BASE) await getOrCreateRole(guild, c.nome, c.cor, c.permissions);
        await log('✅ Staff e Administrador.');

        await log('🎖️ Criando patentes...');
        for (const r of Object.values(config.RANK_CARGOS)) await getOrCreateRole(guild, r.nome, r.cor);
        await log('✅ Patentes.');

        await log('🪖 Criando times...');
        for (const t of Object.values(config.TIMES_BASE)) await getOrCreateRole(guild, t.nome, t.cor);
        await log('✅ Times.');

        await log('🏷️ Criando divisões...');
        for (const d of Object.values(config.DIVISOES)) await getOrCreateRole(guild, d.nome, d.cor);
        await log('✅ Divisões.');

        await log('📁 Criando canais...');
        for (const cat of config.CATEGORIAS) {
            try {
                const category = await guild.channels.create({ name: cat.nome, type: ChannelType.GuildCategory });
                await log(`   📂 ${cat.nome}`);
                for (const chan of cat.canais) {
                    try {
                        await guild.channels.create({
                            name: chan.nome,
                            type: chan.tipo === 'GUILD_TEXT' ? ChannelType.GuildText : ChannelType.GuildVoice,
                            parent: category,
                            topic: chan.topico || null
                        });
                    } catch (e) {
                        await log(`   ❌ Erro ao criar ${chan.nome}: ${e.message}`);
                    }
                }
            } catch (e) {
                await log(`❌ Erro na categoria ${cat.nome}: ${e.message}`);
            }
        }
        await log('✅ Canais criados.');

        await log('🔒 Ajustando permissões...');
        await aplicarPermissoesCanais(guild);
        await log('✅ Permissões configuradas.');

        const verifChannel = guild.channels.cache.find(c => c.name === '🔗-verificação');
        if (verifChannel) {
            const embed = new EmbedBuilder().setTitle('🔗 VINCULAÇÃO ROBLOX').setDescription('Clique no botão abaixo para vincular sua conta Roblox ao servidor.').setColor(0x00AE86);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_vincular').setLabel('Vincular Conta').setStyle(ButtonStyle.Primary).setEmoji('🔗'),
                new ButtonBuilder().setCustomId('btn_sync').setLabel('Sincronizar').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
                new ButtonBuilder().setCustomId('btn_guia').setLabel('Como Vincular').setStyle(ButtonStyle.Secondary).setEmoji('❓')
            );
            await verifChannel.send({ embeds: [embed], components: [row] });
            await log('✅ Painel de verificação enviado.');
        }

        await interaction.editReply('✅ Servidor recriado com sucesso! Verifique este canal para detalhes.');
    } catch (err) {
        console.error(err);
        await log(`❌ Erro crítico: ${err.message}`);
        await interaction.editReply(`❌ Erro: ${err.message}`);
    }
}

// ================= PAINEL DE TICKET =================
async function handleTicketPanel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 CENTRAL DE ATENDIMENTO')
        .setDescription('Escolha uma opção abaixo:')
        .setColor(0x3498db);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('btn_ticket_suporte')
                .setLabel('Suporte')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫'),
            new ButtonBuilder()
                .setCustomId('btn_ticket_compra')
                .setLabel('Comprar Patente')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💲')
        );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Painel de tickets enviado!', ephemeral: true });
}

// ================= PAINEL DE VERIFICAÇÃO =================
async function handlePainel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🔗 VINCULAÇÃO ROBLOX')
        .setDescription('Clique no botão abaixo para vincular sua conta Roblox ao servidor.')
        .setColor(0x00AE86);
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('btn_vincular').setLabel('Vincular Conta').setStyle(ButtonStyle.Primary).setEmoji('🔗'),
            new ButtonBuilder().setCustomId('btn_sync').setLabel('Sincronizar').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
            new ButtonBuilder().setCustomId('btn_guia').setLabel('Como Vincular').setStyle(ButtonStyle.Secondary).setEmoji('❓')
        );
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
}

// ================= VINCULAÇÃO =================
async function startVerification(interaction) {
    try {
        const modal = new ModalBuilder().setCustomId('modal_nick').setTitle('Vincular Roblox');
        const input = new TextInputBuilder()
            .setCustomId('nick_roblox').setLabel('Seu Nickname no Roblox')
            .setPlaceholder('Ex: SeuNick123').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Não foi possível abrir o formulário. Tente novamente.', ephemeral: true }).catch(() => {});
        }
    }
}

async function handleNickSubmit(interaction) {
    const nick = interaction.fields.getTextInputValue('nick_roblox');
    await interaction.deferReply({ ephemeral: true });
    const robloxUser = await getRobloxUserByName(nick);
    if (!robloxUser) return interaction.editReply('❌ Usuário Roblox não encontrado.');

    const codigo = gerarCodigo();

    await VerificationModel.findOneAndUpdate(
        { discordId: interaction.user.id },
        { discordId: interaction.user.id, robloxId: robloxUser.id, username: robloxUser.name, code: codigo, step: 'await_bio' },
        { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
        .setTitle('📝 Código de Verificação')
        .setDescription(`**Copie o código** e cole na descrição (About) do Roblox:\n\`\`\`${codigo}\`\`\`\nDepois clique em **Verificar**.`)
        .setColor(0xf1c40f);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_verificar_bio').setLabel('Verificar').setStyle(ButtonStyle.Success).setEmoji('✅')
    );
    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function checkBio(interaction) {
    const member = interaction.member;
    const data = await VerificationModel.findOne({ discordId: member.id });
    if (!data || data.step !== 'await_bio') {
        return interaction.reply({ content: '❌ Sessão expirada. Inicie a vinculação novamente.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const bioOk = await checkBioForCode(data.robloxId, data.code);
    if (!bioOk) return interaction.editReply('❌ Código não encontrado na bio.');

    const groups = await getRobloxUserGroups(data.robloxId);
    const grupoEB = groups.find(g => g.group.id === config.GRUPO_ID);
    if (!grupoEB) return interaction.editReply('❌ Você não está no grupo do Exército Brasileiro.');

    const rank = grupoEB.role.rank;
    const cargoInfo = config.RANK_CARGOS[rank] || config.RANK_CARGOS[0];
    await aplicarCargos(member, rank, cargoInfo.nome, data.username);

    await VerificationModel.findOneAndUpdate({ discordId: member.id }, { step: 'done' });

    // Mensagem de boas‑vindas no mural
    try {
        await postGroupWall(`Bem‑vindo(a) ${data.username}! Você foi vinculado como ${cargoInfo.nome}.`);
    } catch (e) {
        console.error('Falha ao postar no mural:', e.message);
    }

    await interaction.editReply('✅ Conta vinculada! Seu nick e cargos foram atualizados.');
}

async function handleSync(interaction) {
    const member = interaction.member;
    const data = await VerificationModel.findOne({ discordId: member.id, step: 'done' });
    if (!data) return interaction.reply({ content: '❌ Você ainda não vinculou sua conta.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    const groups = await getRobloxUserGroups(data.robloxId);
    const grupoEB = groups.find(g => g.group.id === config.GRUPO_ID);
    if (!grupoEB) return interaction.editReply('❌ Você não está mais no grupo do Exército Brasileiro.');

    const rank = grupoEB.role.rank;
    const cargoInfo = config.RANK_CARGOS[rank] || config.RANK_CARGOS[0];
    await aplicarCargos(member, rank, cargoInfo.nome, data.username);
    await interaction.editReply('✅ Cargos e nick sincronizados!');
}

async function showGuia(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📘 GUIA COMPLETO DE VINCULAÇÃO')
        .setDescription(
            '**Passo a passo para vincular sua conta Roblox:**\n\n' +
            '1️⃣ Clique no botão **Vincular Conta**.\n' +
            '2️⃣ Digite seu **nickname exato** do Roblox.\n' +
            '3️⃣ O bot gerará um **código de 6 caracteres**.\n' +
            '4️⃣ Copie esse código e vá até seu perfil no Roblox (clique em "Editar perfil").\n' +
            '5️⃣ Cole o código na **descrição** (campo "About") e **salve**.\n' +
            '6️⃣ Volte ao Discord e clique no botão **Verificar**.\n' +
            '7️⃣ Se o código for encontrado na sua bio, você receberá os cargos automaticamente!\n\n' +
            '**Dicas:**\n- O código é case‑sensitive. Copie exatamente como aparece.\n- Não remova o código da bio após a verificação.\n- Caso enfrente problemas, use o botão **Sincronizar** para atualizar seus cargos.'
        )
        .setColor(0x3498db)
        .setFooter({ text: 'Dúvidas? Abra um ticket no canal de suporte.' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ================= TABELA DE COMPRA DE PATENTES =================
async function handleTabelaPatentes(interaction) {
    const autorRank = await getAutorRank(interaction.member);
    if (autorRank < 23) {
        return interaction.reply({ content: '❌ Apenas Sócio+ podem usar este comando.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('💲 TABELA DE COMPRA DE PATENTES')
        .setDescription('Adquira sua patente através de tickets! (Preços reais)')
        .addFields(
            { name: '[3º SGT] Terceiro-Sargento', value: 'R$ 7,00', inline: true },
            { name: '[2º SGT] Segundo-Sargento', value: 'R$ 10,00', inline: true },
            { name: '[1º SGT] Primeiro-Sargento', value: 'R$ 15,00', inline: true },
            { name: '[ST] Subtenente', value: 'R$ 20,00', inline: true },
            { name: '[CT] Cadete', value: 'R$ 30,00', inline: true },
            { name: '[ASP] Aspirante a Oficial', value: 'R$ 50,00', inline: true },
            { name: '[2º TEN] Segundo-Tenente', value: 'R$ 75,00', inline: true },
            { name: '[1º TEN] Primeiro-Tenente', value: 'R$ 100,00', inline: true },
            { name: '[CAP] Capitão', value: 'R$ 150,00', inline: true },
            { name: '[MAJ] Major', value: 'R$ 200,00', inline: true },
            { name: '[TC] Tenente-Coronel', value: 'R$ 300,00', inline: true },
            { name: '[CEL] Coronel', value: 'R$ 500,00', inline: true },
            { name: '[GEN BDA] General de Brigada', value: 'R$ 750,00', inline: true },
            { name: '[GEN DIV] General de Divisão', value: 'R$ 1.000,00', inline: true },
            { name: '[GEN EX] General de Exército', value: 'R$ 1.500,00', inline: true },
            { name: '[SCMT] Subcomandante', value: 'R$ 2.000,00', inline: true },
            { name: '[CMT] Comandante', value: 'R$ 3.000,00', inline: true },
            { name: '[V-PRES] Vice-Presidente', value: 'R$ 5.000,00', inline: true },
            { name: '[PRES] Presidente', value: 'R$ 10.000,00', inline: true },
            { name: '[SC] Sócio', value: 'R$ 15.000,00', inline: true },
            { name: '[SCR] Subcriador', value: 'R$ 20.000,00', inline: true },
        )
        .setColor(0xffd700)
        .setFooter({ text: 'Para comprar, abra um ticket e informe a patente desejada.' });

    await interaction.reply({ embeds: [embed] });
}

// ================= /GIRO COM COOKIE =================
async function handleGirar(interaction) {
    const user = interaction.user;

    const now = Date.now();
    const userData = await VerificationModel.findOne({ discordId: user.id });
    if (userData && userData.lastGiro && (now - userData.lastGiro.getTime()) < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - userData.lastGiro.getTime())) / (60 * 60 * 1000));
        return interaction.reply({ content: `❌ Você já girou hoje! Tente novamente em ${hoursLeft} horas.`, ephemeral: true });
    }

    const premios = [
        { nome: 'VIP por 1 dia', tipo: 'vip' },
        { nome: 'VIP por 3 dias', tipo: 'vip' },
        { nome: 'R$ 500', tipo: 'dinheiro', valor: 500 },
        { nome: 'R$ 1.000', tipo: 'dinheiro', valor: 1000 },
        { nome: 'R$ 5.000', tipo: 'dinheiro', valor: 5000 },
    ];
    const premio = premios[Math.floor(Math.random() * premios.length)];

    await VerificationModel.findOneAndUpdate(
        { discordId: user.id },
        { lastGiro: new Date(), ultimoPremio: premio.nome },
        { upsert: true }
    );

    let entrega = '';
    const robloxId = await getRobloxIdFromDiscord(user.id);
    if (!robloxId) {
        entrega = '⚠️ Você não está vinculado ao Roblox. O prêmio não pode ser entregue.';
    } else if (process.env.ROBLOX_COOKIE && process.env.UNIVERSE_ID) {
        try {
            const cookie = process.env.ROBLOX_COOKIE;
            const universeId = process.env.UNIVERSE_ID;

            const xsrfRes = await fetch('https://auth.roblox.com/v2/logout', {
                method: 'POST',
                headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
            });
            const xsrfToken = xsrfRes.headers.get('x-csrf-token');
            if (!xsrfToken) throw new Error('Token XSRF não obtido.');

            if (premio.tipo === 'vip') {
                const url = `https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=VIP_Concedidos&entryKey=${robloxId}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `.ROBLOSECURITY=${cookie}`,
                        'x-csrf-token': xsrfToken
                    },
                    body: JSON.stringify({ value: true })
                });
                entrega = res.ok ? '✅ VIP entregue automaticamente!' : `⚠️ Erro ao entregar VIP (${res.status}).`;
            } else if (premio.tipo === 'dinheiro') {
                const getUrl = `https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=ForcasBrasilData&entryKey=${robloxId}`;
                const getRes = await fetch(getUrl, {
                    headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrfToken }
                });
                let dataAtual = {};
                if (getRes.ok) {
                    const getData = await getRes.json();
                    dataAtual = getData.value || {};
                }
                dataAtual.Dinheiro = (dataAtual.Dinheiro || 0) + premio.valor;
                const saveRes = await fetch(`https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores/datastore/entries/entry?datastoreName=ForcasBrasilData&entryKey=${robloxId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `.ROBLOSECURITY=${cookie}`,
                        'x-csrf-token': xsrfToken
                    },
                    body: JSON.stringify({ value: dataAtual })
                });
                entrega = saveRes.ok ? `✅ R$ ${premio.valor} entregues automaticamente!` : `⚠️ Erro ao entregar dinheiro (${saveRes.status}).`;
            }
        } catch (err) {
            console.error('Erro na entrega do prêmio:', err);
            entrega = '⚠️ Erro de conexão com a API Roblox.';
        }
    } else {
        entrega = '⚠️ Variáveis ROBLOX_COOKIE e UNIVERSE_ID não configuradas.';
    }

    const embed = new EmbedBuilder()
        .setTitle('🎰 ROLETA DE PRÊMIOS')
        .setDescription(`${user} girou a roleta e ganhou:`)
        .addFields({ name: '🏆 Prêmio', value: `**${premio.nome}**`, inline: false })
        .setColor(0x00ff00);

    if (entrega) {
        embed.addFields({ name: '📦 Entrega', value: entrega, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
}

// ================= /RESTGIRO (APENAS CRIADOR) =================
async function handleRestGiro(interaction) {
    const autorRank = await getAutorRank(interaction.member);
    if (autorRank !== 255) {
        return interaction.reply({ content: '❌ Apenas o Criador pode usar este comando.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('usuario');
    if (!targetUser) {
        return interaction.reply({ content: '❌ Usuário não encontrado.', ephemeral: true });
    }

    await VerificationModel.findOneAndUpdate(
        { discordId: targetUser.id },
        { $unset: { lastGiro: "" } }
    );

    await interaction.reply({ content: `✅ Cooldown do /giro resetado para ${targetUser.tag}.`, ephemeral: true });
}

// ================= PROMOÇÃO / REBAIXAMENTO =================
async function handlePromocao(interaction, tipo) {
    await interaction.deferReply({ ephemeral: true });

    const autorRank = await getAutorRank(interaction.member);
    if (autorRank < 9) {
        return interaction.editReply('❌ Você precisa ser Aspirante Oficial ou superior para usar este comando.');
    }

    const targetUser = interaction.options.getUser('usuario');
    const targetRobloxId = await getRobloxIdFromDiscord(targetUser.id);
    if (!targetRobloxId) {
        return interaction.editReply(`❌ ${targetUser.tag} não está vinculado ao Roblox.`);
    }

    const targetRank = await getTargetRank(targetUser.id);
    const nomeCargo = interaction.options.getString('cargo');

    let cargoRank = 0;
    for (const [nome, rank] of Object.entries(config.RANK_POR_NOME)) {
        if (nome === nomeCargo) {
            cargoRank = rank;
            break;
        }
    }

    if (targetRank >= autorRank && tipo === 'promover') {
        return interaction.editReply('❌ Você não pode promover alguém de patente igual ou superior à sua.');
    }
    if (cargoRank >= autorRank) {
        return interaction.editReply('❌ Você só pode promover até o cargo imediatamente abaixo do seu.');
    }

    try {
        await setRankNoGrupo(targetRobloxId, nomeCargo);
        await interaction.editReply(`✅ ${targetUser.tag} foi ${tipo === 'promover' ? 'promovido' : 'rebaixado'} para **${nomeCargo}** com sucesso!`);
        await logAction(interaction.guild, interaction.user, `${tipo === 'promover' ? 'Promoveu' : 'Rebaixou'} ${targetUser.tag} para ${nomeCargo}`);
    } catch (err) {
        console.error(err);
        await interaction.editReply(`❌ Falha ao alterar rank: ${err.message}`);
    }
}

async function setRankNoGrupo(robloxUserId, nomeCargo) {
    const cookie = process.env.ROBLOX_COOKIE;
    if (!cookie) throw new Error('Cookie Roblox não configurado.');

    let xsrfToken;
    try {
        const xsrfRes = await fetch('https://auth.roblox.com/v2/logout', {
            method: 'POST',
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        xsrfToken = xsrfRes.headers.get('x-csrf-token');
        if (!xsrfToken) throw new Error('Token XSRF não encontrado.');
    } catch (err) {
        throw new Error(`Falha ao obter token XSRF: ${err.message}`);
    }

    let roles;
    try {
        const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${config.GRUPO_ID}/roles`, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'x-csrf-token': xsrfToken }
        });
        if (!rolesRes.ok) {
            const errText = await rolesRes.text();
            throw new Error(`Erro ao buscar cargos: ${rolesRes.status} ${errText}`);
        }
        const data = await rolesRes.json();
        roles = data.roles;
    } catch (err) {
        throw new Error(`Falha ao obter lista de cargos: ${err.message}`);
    }

    const cargoEncontrado = roles.find(r => r.name === nomeCargo);
    if (!cargoEncontrado) {
        throw new Error(`Cargo "${nomeCargo}" não encontrado no grupo. Verifique o nome exato.`);
    }
    const roleId = cargoEncontrado.id;

    const res = await fetch(`https://groups.roblox.com/v1/groups/${config.GRUPO_ID}/users/${robloxUserId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'x-csrf-token': xsrfToken
        },
        body: JSON.stringify({ roleId: roleId })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erro ao alterar rank: ${res.status} ${errText}`);
    }
    return true;
}

async function aplicarPermissoesCanais(guild) {
    for (const cat of config.CATEGORIAS) {
        for (const chanDef of cat.canais) {
            if (!chanDef.permissoes) continue;
            const canal = guild.channels.cache.find(c => c.name === chanDef.nome && c.parent?.name === cat.nome);
            if (!canal) continue;
            const overwrites = [];

            if (chanDef.permissoes.everyone) {
                const everyoneRole = guild.roles.everyone;
                const allow = chanDef.permissoes.everyone.allow ? PermissionsBitField.resolve(chanDef.permissoes.everyone.allow) : 0n;
                const deny = chanDef.permissoes.everyone.deny ? PermissionsBitField.resolve(chanDef.permissoes.everyone.deny) : 0n;
                overwrites.push({ id: everyoneRole.id, allow, deny });
            }

            if (chanDef.permissoes.roles) {
                for (const [nomeRole, perms] of Object.entries(chanDef.permissoes.roles)) {
                    const role = guild.roles.cache.find(r => r.name === nomeRole);
                    if (!role) continue;
                    const allow = perms.allow ? PermissionsBitField.resolve(perms.allow) : 0n;
                    const deny = perms.deny ? PermissionsBitField.resolve(perms.deny) : 0n;
                    overwrites.push({ id: role.id, allow, deny });
                }
            }

            try {
                if (overwrites.length > 0) await canal.permissionOverwrites.set(overwrites);
            } catch (e) {
                console.error(`❌ Erro ao ajustar permissões do canal ${chanDef.nome}:`, e.message);
            }
        }
    }
}

process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

client.login(process.env.DISCORD_TOKEN);
