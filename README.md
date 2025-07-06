# Works for Tera Classic Private Server

### Alpha Version

A Tera Proxy module that automates skill rotations for different classes.

Configurable on a per-class basis with specialized rotations for different roles.

**Original Skeleton created by Pinki Pie**  
**Full Release by MrJambix**

**Requires *Command* module which should come with your proxy.**

**If you run into any bugs/issues, please create an issue on GitHub or contact MrJambix**

## Note on Code Obfuscation

The main code files in this module are intentionally obfuscated to protect the intellectual property and prevent easy copying or modification. This helps ensure that:

1. The module remains stable and functions as intended
2. Users don't accidentally break functionality by modifying code
3. The rotation algorithms remain proprietary
4. The module is protected against unauthorized redistribution

The obfuscation does not affect functionality or performance, and all features remain fully accessible through the documented commands.

## Features

- Automatic skill rotations based on class and role
- Intelligent priority-based skill usage
- Support for both DPS and Tank roles for Warrior
- Buff/debuff tracking for optimal skill usage
- Automatic stance switching
- Emergency defensive measures for tanks
- Configurable human-like behavior

## Commands

### General Commands (use in game chat with /8)

- `/8 on` - Enables the module
- `/8 off` - Disables the module
- `/8 auto` - Enables automatic rotation behavior with no additional delay between skills (Default: On)
- `/8 human` - Enables human-like behavior with adjustable delays between skills (Default: Off)
- `/8 delay [ms]` - Sets a specific delay between skills in milliseconds
- `/8 start` - Manually starts the rotation
- `/8 stop` - Manually stops the rotation

### Class-Specific Commands

#### Warrior

- `/8 tank` - Activates tank mode using Defensive Stance rotation
- `/8 dps` - Activates DPS mode using Assault Stance rotation

## Supported Classes

### Fully Implemented
- **Warrior** - Both DPS (Assault Stance) and Tank (Defensive Stance) rotations
- **- Archer** - DPS rotation with focus on maintaining buffs and debuffs

### Planned
- Berserker - DPS rotation with proper charge management
- Valkyrie - DPS rotation with Ragnarok optimization
- Slayer - DPS rotation with focus on reset mechanics
- Sorcerer - DPS rotation with mana management
- Lancer - Tank rotation with aggro maintenance and party buffs
- Priest - Healing rotation with proper buff uptime
- Mystic - Healing rotation with thrall management
- Reaper - DPS rotation with shadow management
- Gunner - DPS rotation with willpower management
