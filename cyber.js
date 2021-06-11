const { Discord, Client, MessageEmbed, Message } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const güvenlik = require('./güvenli.json')
const fs = require('fs');
const wh = require('./whitelist.json');
const moment = require("moment");
const mongoose = require('mongoose');
mongoose.connect('MongoDbUrl', {useNewUrlParser: true, useUnifiedTopology: true});
const Database = require("./models/role.js");


let aylartoplam = {

  "01": "Ocak",
  "02": "Şubat",
  "03": "Mart",
  "04": "Nisan",
  "05": "Mayıs",
  "06": "Haziran",
  "07": "Temmuz",
  "08": "Ağustos",
  "09": "Eylül",
  "10": "Ekim",
  "11": "Kasım",
  "12": "Aralık"
};
let aylar = aylartoplam;

let Options = {
  "rollog": "rol-log", //kanal log ismi
  "rolyedek": "yedek-log",
  "token": "", //bot token
  "seskanalismi": "Râte" //ses kanal ismi
}

let kurucu = {
  "botOwner": "", //owner id
  "guildID": "", //sunucu id
  "botPrefix": "!" //prefix
}

client.on("ready", async () => {
  client.user.setPresence({activity: {name: '🖤 Cyber'}, status: 'idle'}); //Bot durum, oynuyor //idle: boşta, online: çevrimiçi, dnd: rahatsız etmeyin, invisible: görünmez \\ 
  let botVoiceChannel = client.channels.cache.find(channel => channel.name === Options.seskanalismi);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
  setInterval(() => {
    setRoleBackup();
  }, 1000*60*60*1);
});



client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(kurucu.botPrefix)) return;
  if (message.author.id !== kurucu.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(kurucu.botPrefix.length);
  let embed = new MessageEmbed().setColor("#6d1d76").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(` Olmak zordur...`).setTimestamp();
  
  if (command === "eval" && message.author.id === kurucu.botOwner) {
    if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
      message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };

  if(command === "güvenli") {
    let hedef;
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
    let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
    if (rol) hedef = rol;
    if (uye) hedef = uye;
    let guvenliler = wh.whitelist || [];
    if (!hedef) return message.channel.send(embed.setDescription(` Güvenli Listede Bulunan Üyeler Aşşağıda Verilmiştir.`).addField("\`\`Güvenli Liste\`\`", guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n') : "**Güvenli Listede Hiçbir Kullanıcı Bulunmamkta.!**"));
    if (guvenliler.some(g => g.includes(hedef.id))) {
      guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
      wh.whitelist = guvenliler;
      fs.writeFile("./whitelist.json", JSON.stringify(wh), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(` ${hedef} kullanıcısı başarılı bir şekilde güvenli listeden çıkarıldı!`));
    } else {
      wh.whitelist.push(`y${hedef.id}`);
      fs.writeFile("./whitelist.json", JSON.stringify(wh), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(` ${hedef} Kullanıcısı başarılı bir şekilde güvenli listeye eklendi!`));
    };
  };

    if(command === "koruma")  {
    let korumalar = Object.keys(güvenlik).filter(k => k.includes('Guard'));
    if (!args[0] || !korumalar.some(k => k.includes(args[0]))) return message.channel.send(embed.setDescription(`Sunucudaki aktif korumalar: ${korumalar.filter(k => güvenlik[k]).map(k => `\`${k}\``).join(', ')}\n\n † Sunucuda Bulunan Tüm Korumalar: ${korumalar.map(k => `\`${k}\``).join(' | ')}`));
    let koruma = korumalar.find(k => k.includes(args[0]));
    güvenlik[koruma] = !güvenlik[koruma];
    fs.writeFile("./güvenlik.json", JSON.stringify(güvenlik), (err) => {
      if (err) console.log(err);
    });
    message.channel.send(embed.setDescription(`\`\`${koruma}\`\` koruması, ${message.author} - (\`${message.author.id}\`) tarafından ${güvenlik[koruma] ? "aktif edildi ✅" : "devre dışı bırakıldı ❎"}!`));
  };

  if (command === "cyber" || command === "yedekal") {
    setRoleBackup();
    message.channel.send(` Başarılı bir şekilde yedek alındı.`)
  };

  if (command === "kur" || command === "kurulum" || command === "setup") {
    if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));

    Database.findOne({guildID: kurucu.guildID, roleID: args[0]}, async (err, roleData) => {
      if (!roleData) return message.channel.send(embed.setDescription("Belirtilen rol ID'sine ait veri bulunamadı!"));
      message.react("✅");
      let yeniRol = await message.guild.roles.create({
        data: {
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          permissions: roleData.permissions,
          position: roleData.position,
          mentionable: roleData.mentionable
        },
        reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
      });

      setTimeout(() => {
        let kanalPermVeri = roleData.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);

      let roleMembers = roleData.members;
      roleMembers.forEach((member, index) => {
        let uye = message.guild.members.cache.get(member);
        if (!uye || uye.roles.cache.has(yeniRol.id)) return;
        setTimeout(() => {
          uye.roles.add(yeniRol.id).catch(console.error);
        }, index*3000);
      });

      let yedekalıomknk = client.channels.cache.find(channel => channel.name === Options.rolyedek);
      if (yedekalıomknk) { yedekalıomknk.send(
        new MessageEmbed()
        .setColor('2f3136')
        .setDescription(`\`Rol Yedeği Kuruldu\`!\n **Yedeği Kuran** : ${message.author} - (\`${message.author.id}\`)\n **Kurulan Rol** : \`${roleData.name}\` - (\`${roleData.roleID}\`)`)
   );
};
    });
  };
});

function guvenli(kisiID) {
  let uye = client.guilds.cache.get(kurucu.guildID).members.cache.get(kisiID);
  let guvenliler = wh.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === kurucu.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0); // Rollerin Yt Sıfırlıyor
  });

  let logKanali = client.channels.cache.find(channel => channel.name === Options.rollog)
  if (logKanali) { logKanali.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`Rol Yetkilerini Kapattım!`)
    )
};
};

const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(kurucu.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "ban") return uye.ban({ reason: " ROL KORUMA" }).catch();
};

client.on("roleCreate", async role => {
  let entry = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.roleGuard) return;
  role.delete({ reason: " Rol Koruma" });
  cezalandir(entry.executor.id, "ban");
  let rolkoruma = client.channels.cache.find(channel => channel.name === Options.rollog);
  if (rolkoruma) { rolkoruma.send(
    new MessageEmbed()
    .setColor('2f3136')
    .setDescription(`📗 \`Sunucuda Bir Rol Oluşturuldu\`! ${entry.executor} - (\`${entry.executor.id}\`) tarafından bir rol oluşturuldu!`)
  );
};
ytKapat("798999362176155718"); //Sunucu id
});

client.on("roleUpdate", async (oldRole, newRole) => {
  let entry = await newRole.guild.fetchAuditLogs({type: 'ROLE_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newRole.guild.roles.cache.has(newRole.id) || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.roleGuard) return;
  cezalandir(entry.executor.id, "ban");
  if (yetkiPermleri.some(p => !oldRole.permissions.has(p) && newRole.permissions.has(p))) {
    newRole.setPermissions(oldRole.permissions);
    newRole.guild.roles.cache.filter(r => !r.managed && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_GUILD"))).forEach(r => r.setPermissions(36818497));
  };
  newRole.edit({
    name: oldRole.name,
    color: oldRole.hexColor,
    hoist: oldRole.hoist,
    permissions: oldRole.permissions,
    mentionable: oldRole.mentionable
  });
  let logKanali = client.channels.cache.find(channel => channel.name === Options.rollog);
  if (logKanali) { logKanali.send(
    new MessageEmbed()
    .setColor('2f3136')
    .setDescription(`📒 \`Sunucudaki Bir Rol Güncellendi\`! ${entry.executor} - (\`${entry.executor.id}\`) tarafından **${oldRole.name}** rolü güncellendi!`))
};
ytKapat("798999362176155718"); //Sunucu id
});

client.on("roleDelete", async role => {
  let entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.roleGuard) return;
  cezalandir(entry.executor.id, "ban");
  let yeniRol = await role.guild.roles.create({
    data: {
      name: role.name,
      color: role.hexColor,
      hoist: role.hoist,
      position: role.position,
      permissions: role.permissions,
      mentionable: role.mentionable
    },
    reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
  });

  Database.findOne({guildID: role.guild.id, roleID: role.id}, async (err, roleData) => {
    if (!roleData) return;
    setTimeout(() => {
      let kanalPermVeri = roleData.channelOverwrites;
      if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
        let kanal = role.guild.channels.cache.get(perm.id);
        if (!kanal) return;
        setTimeout(() => {
          let yeniKanalPermVeri = {};
          perm.allow.forEach(p => {
            yeniKanalPermVeri[p] = true;
          });
          perm.deny.forEach(p => {
            yeniKanalPermVeri[p] = false;
          });
          kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
        }, index*5000);
      });
    }, 5000);

    let roleMembers = roleData.members;
    roleMembers.forEach((member, index) => {
      let uye = role.guild.members.cache.get(member);
      if (!uye || uye.roles.cache.has(yeniRol.id)) return;
      setTimeout(() => {
        uye.roles.add(yeniRol.id).catch();
      }, index*3000);
    });
  });

  let rolkoruma = client.channels.cache.find(channel => channel.name === Options.rollog);
  if (rolkoruma) { rolkoruma.send(
    new MessageEmbed()
    .setColor('2f3136')
    .setDescription(`📕 \`Sunucuda Bir Rol Silindi\` ${entry.executor} - (\`${entry.executor.id}\`) tarafından **${role.name}** - (\`${role.id}\`) rolü silindi. Rolü tekrar açtım ve üyelere dağıtmaya başladım. Kanalların izinlerini düzenliyorum.`)
  ) 
};
 ytKapat("798999362176155718"); //Sunucu id
});

function setRoleBackup() {
  let guild = client.guilds.cache.get(kurucu.guildID);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      Database.findOne({guildID: kurucu.guildID, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new Database({
            _id: new mongoose.Types.ObjectId(),
            guildID: kurucu.guildID,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });

    Database.find({guildID: kurucu.guildID}).sort().exec((err, roles) => {
      roles.filter(r => !guild.roles.cache.has(r.roleID) && Date.now()-r.time > 1000*60*60*24*3).forEach(r => {
        Database.findOneAndDelete({roleID: r.roleID});
      });
    });

    let yedekalıomknk = client.channels.cache.find(channel => channel.name === Options.rolyedek);
    yedekalıomknk.send(`📘 \`Sunucunun Yedeği Başarılı Bir Şekilde Güncellendi.\` \`\`\`${moment(Date.now()).format("DD")} ${aylar[moment(Date.now()).format("MM")]} ${moment(Date.now()).format("YYYY HH:mm:ss")}\`\`\` `);
  };
};

client.login(Options.token).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));