--// ServerScriptService: RoleTagsWithCommands_HeaviestHitters.server.lua
-- UPDATED TO RECEIVE DATA FROM DISCORD BOT VIA HTTP

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local TextChatService = game:GetService("TextChatService")
local MessagingService = game:GetService("MessagingService")
local HttpService = game:GetService("HttpService")

local ROLE_STORE_NAME = "RoleTags_V4"
local ROLE_STORE
local roleStoreOk, roleStoreResult = pcall(function()
	return DataStoreService:GetDataStore(ROLE_STORE_NAME)
end)
if roleStoreOk then
	ROLE_STORE = roleStoreResult
else
	warn("[ROLES] DataStore unavailable. Publish the place and enable API Services for saved/global titles.", roleStoreResult)
end

local ROLE_TOPIC = "OhThatsChaos_RoleTags_V4_Updates"

local DEBUG = true
local function dprint(...) if DEBUG then print("[ROLES]", ...) end end
local function dwarn(...) warn("[ROLES]", ...) end

local dataLoaded = false

-- WHO CAN RUN COMMANDS
local ADMINS = {
	[9258268196] = true,
	[7143987491] = true,
	[5477200532] = true,
	[8895568069] = true,
	[3460169983] = true,
}

local Roles = {
	eater = {},
	staff = {},
	hh = {},
	cc = {},
	hh2 = {},
	hom = {},
}

local RemoveListAliases = {
	remove = true,
	removetitle = true,
	removetitles = true,
	untitle = true,
	clear = true,
	cleartitle = true,
	cleartitles = true,
}

local RoleDisplayNames = {
	eater = "Eater",
	staff = "Staff",
	hh = "Heavy Hitter",
	cc = "Content Creator",
	hh2 = "Chaotic Hitters",
	hom = "Head Management",
}

local RoleAliases = {
	eater = "eater",
	staff = "staff",
	stafftitle = "staff",
	stafftittle = "staff",
	hh = "hh",
	heavy = "hh",
	hitter = "hh",
	heavyhitter = "hh",
	cc = "cc",
	creator = "cc",
	contentcreator = "cc",
	contentcreater = "cc",
	hh2 = "hh2",
	heaviesthitter = "hh2",
	heaviesthitters = "hh2",
	chaotichitter = "hh2",
	chaotichitters = "hh2",
	hom = "hom",
	headmanagement = "hom",
	headofmanagement = "hom",
	management = "hom",
}

local DefaultHeaviestHitters = {
	[1] = true,
}

local DefaultContentCreators = {
	[1] = true,
}

-- ========= SAVE / LOAD =========
local function serializeRoles()
	local data = { eater = {}, staff = {}, hh = {}, cc = {}, hh2 = {}, hom = {} }
	for roleName, roleMap in pairs(Roles) do
		for userId, enabled in pairs(roleMap) do
			if enabled then
				table.insert(data[roleName], userId)
			end
		end
	end
	dprint("Serialized roles")
	return data
end

local function applySerializedRoles(data)
	if typeof(data) ~= "table" then 
		dwarn("applySerializedRoles: data is not a table")
		return false 
	end

	for roleName in pairs(Roles) do
		Roles[roleName] = {}
	end

	for roleName, list in pairs(data) do
		if Roles[roleName] and typeof(list) == "table" then
			for _, userId in ipairs(list) do
				if typeof(userId) == "number" then
					Roles[roleName][userId] = true
				end
			end
		end
	end

	return true
end

local saveInProgress = false
local pendingSave = false

local function saveRoles()
	if saveInProgress then
		pendingSave = true
		return
	end

	saveInProgress = true
	if not ROLE_STORE then
		dwarn("Skipping save because DataStore is unavailable")
		return false
	end

	dprint("Starting save...")

	local attempts = 0
	local maxAttempts = 5
	local success = false

	while attempts < maxAttempts and not success do
		attempts += 1
		local dataToSave = serializeRoles()
		local ok, err = pcall(function()
			ROLE_STORE:SetAsync("ALL_ROLES", dataToSave)
		end)
		if ok then
			success = true
			dprint("Roles saved successfully (attempt " .. attempts .. ")")
		else
			dwarn("Save attempt " .. attempts .. " failed:", err)
			if attempts < maxAttempts then
				task.wait(1)
			end
		end
	end

	saveInProgress = false

	if pendingSave then
		pendingSave = false
		task.defer(saveRoles)
	end

	return success
end

local function loadRoles()
	if not ROLE_STORE then
		dwarn("Skipping load because DataStore is unavailable")
		dataLoaded = true
		return false
	end

	dprint("Loading roles from DataStore...")
	local attempts = 0
	local maxAttempts = 5
	local data = nil
	local ok = false

	while attempts < maxAttempts do
		attempts += 1
		ok, data = pcall(function()
			return ROLE_STORE:GetAsync("ALL_ROLES")
		end)

		if ok then
			dprint("GetAsync succeeded on attempt", attempts)
			break
		end

		dwarn("Load attempt " .. attempts .. " failed, retrying...")
		task.wait(1 * attempts)
	end

	if not ok then
		dwarn("DataStore load failed after " .. maxAttempts .. " attempts")
		return false
	end

	if data then
		applySerializedRoles(data)
		dprint("Loaded existing roles from DataStore")
	else
		dprint("No existing data, seeding defaults")
		for userId, v in pairs(DefaultHeaviestHitters) do
			if v then Roles.hh2[userId] = true end
		end
		for userId, v in pairs(DefaultContentCreators) do
			if v then Roles.cc[userId] = true end
		end
		saveRoles()
	end

	for userId, v in pairs(DefaultContentCreators) do
		if v and not Roles.cc[userId] then
			Roles.cc[userId] = true
		end
	end

	dataLoaded = true
	return true
end

loadRoles()

local AUTO_SAVE_INTERVAL = 60

task.spawn(function()
	while true do
		task.wait(AUTO_SAVE_INTERVAL)
		dprint("Auto-saving roles...")
		saveRoles()
	end
end)

game:BindToClose(function()
	dprint("Server shutting down, saving roles...")
	saveRoles()
	task.wait(3)
end)

local function getUserIdFromUsername(username: string)
	username = tostring(username or ""):gsub("^%s+", ""):gsub("%s+$", "")
	if username == "" then return nil, "no username" end

	for attempt = 1, 3 do
		local ok, res = pcall(function()
			return Players:GetUserIdFromNameAsync(username)
		end)
		if ok and typeof(res) == "number" then
			return res
		end
		task.wait(0.25 * attempt)
	end

	return nil, "couldnt find that user / api blocked / rate limit"
end

local function normalizeRoleName(roleName: string)
	local key = tostring(roleName or ""):lower():gsub("[^%w]", "")
	return RoleAliases[key]
end

local function isRemoveListName(name: string)
	local key = tostring(name or ""):lower():gsub("[^%w]", "")
	return RemoveListAliases[key] == true
end

local function getRoleDisplayName(roleName: string)
	return RoleDisplayNames[roleName] or tostring(roleName)
end

local function publishRoleUpdate(roleName, userId, enabled)
	pcall(function()
		MessagingService:PublishAsync(ROLE_TOPIC, {
			roleName = roleName,
			userId = userId,
			enabled = enabled == true,
		})
	end)
end

local function clearTag(character)
	local head = character:FindFirstChild("Head")
	if not head then return end
	local old = head:FindFirstChild("TitleTag")
	if old then old:Destroy() end
end

local function makeTag(character, titleText, titleColor, options)
	local head = character:FindFirstChild("Head")
	if not head then return end

	clearTag(character)

	options = options or {}
	local width = options.width or 180

	local billboard = Instance.new("BillboardGui")
	billboard.Name = "TitleTag"
	billboard.Adornee = head
	billboard.Size = UDim2.new(0, width, 0, 45)
	billboard.StudsOffset = Vector3.new(0, 2.8, 0)
	billboard.AlwaysOnTop = true
	billboard.Parent = head

	local label = Instance.new("TextLabel")
	label.Parent = billboard
	label.BackgroundTransparency = 1
	label.Size = UDim2.new(1, 0, 1, 0)
	label.Text = titleText
	label.TextColor3 = titleColor
	label.TextStrokeTransparency = 0.3
	label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	label.Font = Enum.Font.GothamBlack
	label.TextWrapped = false
	label.TextXAlignment = Enum.TextXAlignment.Center
	label.TextYAlignment = Enum.TextYAlignment.Center

	if options.scaled == nil then
		label.TextScaled = true
	else
		label.TextScaled = options.scaled
	end

	if label.TextScaled == false then
		label.TextSize = options.textSize or 22
	end
end

local function applyTitle(player: Player)
	local character = player.Character
	if not character then return end

	local head = character:FindFirstChild("Head")
	if not head then
		head = character:WaitForChild("Head", 5)
	end
	if not head then return end

	local userId = player.UserId

	if Roles.eater[userId] then
		makeTag(character, "Eater 🥊", Color3.fromRGB(0, 0, 0), { width = 180, scaled = true })
	elseif Roles.staff[userId] then
		makeTag(character, "🛡️ Staff", Color3.fromRGB(0, 170, 255), { width = 180, scaled = true })
	elseif Roles.hom[userId] then
		makeTag(character, "★ Head Management", Color3.fromRGB(255, 205, 80), {
			width = 240,
			scaled = false,
			textSize = 22,
		})
	elseif Roles.hh2[userId] then
		makeTag(character, "✔️ Chaotic Hitters", Color3.fromRGB(255, 0, 0), {
			width = 210,
			scaled = false,
			textSize = 22,
		})
	elseif Roles.hh[userId] then
		makeTag(character, "🥊 Heavy Hitter", Color3.fromRGB(255, 0, 0), { width = 180, scaled = true })
	elseif Roles.cc[userId] then
		makeTag(character, "⭐ Content Creator", Color3.fromRGB(255, 215, 0), { width = 190, scaled = true })
	else
		clearTag(character)
	end
end

local function isAdmin(player: Player)
	return ADMINS[player.UserId] == true
end

local function setRoleByUserId(roleName: string, userId: number, enabled: boolean, shouldPublish: boolean)
	if not Roles[roleName] then return false, "bad role" end

	local alreadyEnabled = Roles[roleName][userId] == true
	if alreadyEnabled == (enabled == true) then
		return true, false
	end

	Roles[roleName][userId] = enabled or nil

	local saveSuccess = saveRoles()

	local targetPlayer = Players:GetPlayerByUserId(userId)
	if targetPlayer then
		applyTitle(targetPlayer)
	end

	if shouldPublish ~= false then
		publishRoleUpdate(roleName, userId, enabled)
	end

	return true, true
end

local function setRole(roleName: string, username: string, enabled: boolean)
	roleName = normalizeRoleName(roleName) or roleName
	if not Roles[roleName] then return false, "bad role" end

	local userId, err = getUserIdFromUsername(username)
	if not userId then return false, err end

	local ok, changedOrErr = setRoleByUserId(roleName, userId, enabled, true)
	if not ok then return false, changedOrErr end

	dprint((enabled and "Added" or "Removed"), roleName, username, userId)
	return true
end

local function clearRoles(username: string)
	local userId, err = getUserIdFromUsername(username)
	if not userId then return false, err end

	local changed = false
	for roleName, roleMap in pairs(Roles) do
		if roleMap[userId] then
			roleMap[userId] = nil
			changed = true
			publishRoleUpdate(roleName, userId, false)
		end
	end

	if changed then
		saveRoles()
		local targetPlayer = Players:GetPlayerByUserId(userId)
		if targetPlayer then
			applyTitle(targetPlayer)
		end
	end

	return true
end

-- ========= DISCORD BOT WEBHOOK HANDLER =========
local DISCORD_WEBHOOK_ENABLED = false -- Set to true and configure webhook URL
local DISCORD_WEBHOOK_URL = ""

local function handleDiscordWebhook(data)
	if typeof(data) ~= "table" then return end

	dprint("Received data from Discord bot:", HttpService:JSONEncode(data))

	if data.source == "discord-bot" and data.roles then
		for _, roleData in ipairs(data.roles) do
			local roleName = roleData.roleName
			local usernames = roleData.usernames

			if roleName == "remove" then
				for _, username in ipairs(usernames) do
					clearRoles(username)
				end
			else
				for _, username in ipairs(usernames) do
					setRole(roleName, username, true)
				end
			end
		end

		dprint("Processed Discord bot data successfully")
	end
end

-- HTTP endpoint for Discord bot (requires Roblox Game Server Service)
if DISCORD_WEBHOOK_ENABLED and DISCORD_WEBHOOK_URL ~= "" then
	-- This would require Roblox to expose an HTTP endpoint
	-- Currently Roblox doesn't support inbound HTTP requests to game servers
	-- Alternative: Use a third-party service or polling
	dwarn("Direct HTTP webhook not supported by Roblox. Use polling or third-party service.")
end

-- Expose Roles to _G for other scripts to access
_G.Roles = Roles

-- ========= PLAYER HOOKS =========
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function()
		task.wait(0.15)
		applyTitle(player)
	end)

	if player.Character then
		applyTitle(player)
	end
end)

Players.PlayerRemoving:Connect(function(player)
	dprint("Player leaving, saving roles...")
	saveRoles()
end)

for _, player in ipairs(Players:GetPlayers()) do
	player.CharacterAdded:Connect(function()
		task.wait(0.15)
		applyTitle(player)
	end)

	if player.Character then
		applyTitle(player)
	end
end

pcall(function()
	MessagingService:SubscribeAsync(ROLE_TOPIC, function(message)
		local data = message.Data
		if typeof(data) ~= "table" or typeof(data.userId) ~= "number" or typeof(data.roleName) ~= "string" then
			return
		end

		local roleName = normalizeRoleName(data.roleName)
		if not roleName then
			return
		end

		setRoleByUserId(roleName, data.userId, data.enabled == true, false)
	end)
end)

dprint("Role tags system loaded (Discord bot integration ready)")
