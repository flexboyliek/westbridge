--// ServerScriptService: StaffActivityTracker.server.lua
-- Tracks staff activity and logs to Discord webhook

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

-- CONFIGURATION (Set these as script attributes or modify here)
local DISCORD_WEBHOOK_URL = "" -- Set your Discord webhook URL here or as attribute
local TRACK_STAFF_ONLY = true -- Only track players with staff roles
local LOG_JOIN_LEAVE = true
local LOG_COMMANDS = true
local LOG_PLAYTIME = true
local PLAYTIME_LOG_INTERVAL = 300 -- Log playtime every 5 minutes

-- Staff roles to track (matches your role system)
local STAFF_ROLES = {
	hos = true,
	staff = true,
	hh = true,
	cc = true,
	hh2 = true,
	hom = true,
}

-- Get webhook URL from attribute if set
local function getConfigAttribute(name, defaultValue)
	local value = script:GetAttribute(name)
	if value == nil then
		return defaultValue
	end
	return value
end

DISCORD_WEBHOOK_URL = tostring(getConfigAttribute("DiscordWebhookUrl", DISCORD_WEBHOOK_URL))

-- Activity data tracking
local activeStaff = {} -- [userId] = { joinTime, username, role, lastCommandTime }
local commandCounts = {} -- [userId] = { commandName = count }

-- Check if player is staff (checks role system from other script)
local function isStaff(player)
	if not TRACK_STAFF_ONLY then
		return true
	end
	
	-- Try to access the Roles table from the role tags script
	-- This assumes the role tags script is in ServerScriptService
	local roleScript = game.ServerScriptService:FindFirstChild("RoleTagsWithCommands_HeaviestHitters")
	if roleScript then
		-- The script uses a Roles table, but we can't access it directly
		-- Instead, we'll check if the player has a title tag
		local function checkPlayerForTag()
			if player.Character and player.Character:FindFirstChild("Head") then
				local head = player.Character.Head
				local titleTag = head:FindFirstChild("TitleTag")
				if titleTag then
					return true
				end
			end
			return false
		end
		
		-- Check current character
		if checkPlayerForTag() then
			return true
		end
		
		-- Wait for character to load if not loaded
		if not player.Character then
			player.CharacterAdded:Wait()
			task.wait(0.5)
			if checkPlayerForTag() then
				return true
			end
		end
	end
	
	-- Fallback: Check if player has any staff role from the role system
	-- This requires the role script to expose the Roles table or a function
	if _G.Roles then
		local userId = player.UserId
		for roleName, roleMap in pairs(_G.Roles) do
			if roleMap[userId] then
				return true
			end
		end
	end
	
	return false
end

-- Send to Discord webhook
local function sendDiscordLog(title, description, color, fields)
	if DISCORD_WEBHOOK_URL == "" then
		return
	end
	
	local payload = {
		username = "Staff Activity Tracker",
		embeds = {
			{
				title = title,
				description = description,
				color = color or 3447003,
				fields = fields or {},
				timestamp = DateTime.now():ToIsoDate(),
				footer = {
					text = "Roblox Staff Activity System",
				},
			},
		},
	}
	
	task.spawn(function()
		local ok, response = pcall(function()
			return HttpService:RequestAsync({
				Url = DISCORD_WEBHOOK_URL,
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
				},
				Body = HttpService:JSONEncode(payload),
			})
		end)
		
		if not ok then
			warn("[ACTIVITY] Discord webhook error:", response)
		elseif not response.Success then
			warn("[ACTIVITY] Discord webhook failed:", response.StatusCode)
		end
	end)
end

-- Format time duration
local function formatTime(seconds)
	local hours = math.floor(seconds / 3600)
	local minutes = math.floor((seconds % 3600) / 60)
	
	if hours > 0 then
		return string.format("%dh %dm", hours, minutes)
	else
		return string.format("%dm", minutes)
	end
end

-- Player joined
local function onPlayerAdded(player)
	if not isStaff(player) then
		return
	end
	
	activeStaff[player.UserId] = {
		joinTime = tick(),
		username = player.Name,
		role = "Staff",
		lastCommandTime = 0,
		commandCount = 0,
	}
	
	if LOG_JOIN_LEAVE then
		sendDiscordLog(
			"👤 Staff Joined",
			string.format("**%s** (ID: %d) joined the game", player.Name, player.UserId),
			5763719,
			{
				{ name = "Username", value = player.Name, inline = true },
				{ name = "User ID", value = tostring(player.UserId), inline = true },
				{ name = "Time", value = os.date("%H:%M:%S"), inline = true },
			}
		)
	end
	
	print("[ACTIVITY] Staff joined:", player.Name, player.UserId)
end

-- Player left
local function onPlayerRemoving(player)
	local staffData = activeStaff[player.UserId]
	if not staffData then
		return
	end
	
	local playtime = tick() - staffData.joinTime
	
	if LOG_JOIN_LEAVE then
		sendDiscordLog(
			"👋 Staff Left",
			string.format("**%s** (ID: %d) left the game", player.Name, player.UserId),
			15158332,
			{
				{ name = "Username", value = player.Name, inline = true },
				{ name = "User ID", value = tostring(player.UserId), inline = true },
				{ name = "Playtime", value = formatTime(playtime), inline = true },
				{ name = "Commands Used", value = tostring(staffData.commandCount), inline = true },
			}
		)
	end
	
	print("[ACTIVITY] Staff left:", player.Name, "Playtime:", formatTime(playtime))
	activeStaff[player.UserId] = nil
end

-- Track command usage (hook into your existing command system)
local function trackCommand(player, commandName)
	if not isStaff(player) then
		return
	end
	
	local staffData = activeStaff[player.UserId]
	if not staffData then
		return
	end
	
	staffData.lastCommandTime = tick()
	staffData.commandCount = (staffData.commandCount or 0) + 1
	
	if LOG_COMMANDS then
		sendDiscordLog(
			"⚡ Command Used",
			string.format("**%s** used command: `%s`", player.Name, commandName),
		 15844367,
			{
				{ name = "Username", value = player.Name, inline = true },
				{ name = "Command", value = commandName, inline = true },
				{ name = "Time", value = os.date("%H:%M:%S"), inline = true },
			}
		)
	end
	
	print("[ACTIVITY] Command:", player.Name, commandName)
end

-- Periodic playtime logging
local function startPlaytimeLogger()
	if not LOG_PLAYTIME then
		return
	end
	
	task.spawn(function()
		while true do
			task.wait(PLAYTIME_LOG_INTERVAL)
			
			for userId, staffData in pairs(activeStaff) do
				local player = Players:GetPlayerByUserId(userId)
				if player then
					local playtime = tick() - staffData.joinTime
					
					sendDiscordLog(
						"⏱️ Playtime Update",
						string.format("**%s** has been online for %s", staffData.username, formatTime(playtime)),
						3447003,
						{
							{ name = "Username", value = staffData.username, inline = true },
							{ name = "Playtime", value = formatTime(playtime), inline = true },
							{ name = "Commands", value = tostring(staffData.commandCount), inline = true },
						}
					)
				end
			end
		end
	end)
end

-- Hook into existing chat commands (modify this based on your command system)
local function hookChatCommands()
	-- This is a placeholder - you need to integrate this with your existing command handler
	-- For example, if you have a handleCommand function, wrap it:
	
	-- local originalHandleCommand = handleCommand
	-- handleCommand = function(speaker, msg)
	--     trackCommand(speaker, msg)
	--     return originalHandleCommand(speaker, msg)
	-- end
	
	print("[ACTIVITY] Chat command hooks ready (integrate with your command system)")
end

-- Initialize
print("[ACTIVITY] Staff Activity Tracker initialized")
print("[ACTIVITY] Discord webhook:", DISCORD_WEBHOOK_URL ~= "" and "enabled" or "disabled")

-- Connect events
Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

-- Hook existing players
for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(function()
		onPlayerAdded(player)
	end)
end

-- Start systems
startPlaytimeLogger()
hookChatCommands()

-- Expose trackCommand for other scripts to use
_G.StaffActivityTracker = {
	trackCommand = trackCommand,
	isStaff = isStaff,
}
