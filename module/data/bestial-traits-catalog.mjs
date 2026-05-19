// Bestial Traits catalog for the DBU system
// Source: https://dbu-rpg.com/bestial-traits/
// Total traits: 14

export const BESTIAL_TRAITS_CATALOG = [
  {
    "id": "bestial_alternate_sight",
    "name": "Alternate Sight",
    "category": "body",
    "description": "Your eyes are clearly designed to work in a different way than most, allowing you to see in the dark.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Improved Sight",
        "text": "Treat No Sight as Limited Sight and Limited Sight as Normal Sight (see — Visibility) for their penalties."
      },
      {
        "level": 2,
        "activationType": "passive",
        "keyword": "Perception Boost",
        "text": "Increase the Dice Score of your Perception Skill Checks by 1."
      },
      {
        "level": 3,
        "activationType": "passive",
        "keyword": "Dodge Boost",
        "text": "Increase the Natural Result of your Dodge Rolls by 1."
      },
      {
        "level": 4,
        "activationType": "limited",
        "keyword": "Predator's Focus",
        "text": "As an Instant Maneuver, target an Opponent who you are not Oblivious of. Make a Skill Clash (Perception vs Perception/Stealth) against them. If you win, increase the Strike and Wound Rolls of your next Attacking Maneuver made against that Opponent by 1(T) and 2(T) respectively.",
        "usageLimit": "round",
        "maxUses": 1
      }
    ]
  },
  {
    "id": "bestial_build",
    "name": "Bestial Build",
    "category": "body",
    "description": "Animals come in a variety of shapes, sizes, and anatomies. Because of this, some have varying methods of self-defense.",
    "effects": [
      {
        "level": 1,
        "activationType": "option",
        "keyword": "Option",
        "text": "Upon gaining this Bestial Trait, choose one of the following effects:",
        "options": [
          {
            "name": "Thick Hide",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "Increase your Soak Value by 2(T) and your Corporeal Saving Throw by 1(T)."
          },
          {
            "name": "Slender",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "Increase your Defense Value and Impulsive Saving Throw by 1(T)."
          }
        ]
      }
    ]
  },
  {
    "id": "bestial_movement",
    "name": "Bestial Movement",
    "category": "body",
    "description": "Adapted to moving in different ways or through different environments, some animals are capable of extraordinary feats of movement.",
    "effects": [
      {
        "level": 1,
        "activationType": "option",
        "keyword": "Option",
        "text": "Upon gaining this Bestial Trait for the first time, choose one of the following effects:",
        "options": [
          {
            "name": "Feral Agility",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "While you are in the Standard Environment, increase your Speed by 1(T) and you do not need to spend any Ki Points when exceeding your Normal Speed with the Movement Maneuver."
          },
          {
            "name": "Swimming",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "While you are in the Underwater Environment, increase your Speed by 1(T) and you do not need to spend any Ki Points when exceeding your Normal Speed with the Movement Maneuver."
          },
          {
            "name": "Wings",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "While you are in the Sky Environment, increase your Speed by 1(T) and you do not need to spend any Ki Points when exceeding your Normal Speed with the Movement Maneuver. Gain access to the Soar Maneuver if you did not possess it already."
          },
          {
            "name": "Burrowing",
            "activationType": "limited",
            "keyword": "1/Round",
            "text": "When using the Movement Maneuver while in the Standard Environment, you can go Underground if the Hardness value for the ground is 3 or less. When you do, enter Cover until the start of your next turn as an Out-of-Sequence Maneuver (the ground is your Feature)."
          }
        ]
      },
      {
        "level": 2,
        "activationType": "choice",
        "keyword": "Choice",
        "text": "Depending on your choice for the Option effect, gain the following effects:",
        "options": [
          {
            "name": "Feral Agility",
            "activationType": "triggered",
            "keyword": "Triggered, 1/Round",
            "text": "When making a Physical Attacking Maneuver, while in the Standard Environment, target an Opponent within your Boosted Speed. Before making the Attacking Maneuver, move to an unoccupied adjacent Square around that Opponent. When you use this effect, ignore the effects of the Sky Environment for this Attacking Maneuver."
          },
          {
            "name": "Swimming",
            "activationType": "limited",
            "keyword": "1/Round",
            "text": "While Underwater, you can move to another Square within your Boosted Speed as an Instant Maneuver."
          },
          {
            "name": "Wings",
            "activationType": "limited",
            "keyword": "1/Round",
            "text": "If you use the Soar Maneuver, you may use the Movement Maneuver as an Out-of-Sequence Maneuver. You do not have to pay Ki Points to use the effects of Rapid Movement through this Movement Maneuver."
          },
          {
            "name": "Burrowing",
            "activationType": "limited",
            "keyword": "1/Round",
            "text": "While in Cover, you can move to another Square within your Boosted Speed as an Instant Maneuver without losing Cover."
          }
        ]
      }
    ]
  },
  {
    "id": "bestial_camouflage",
    "name": "Camouflage",
    "category": "body",
    "description": "You possess, via some biological means, the ability to hide from predators and other dangers.",
    "effects": [
      {
        "level": 1,
        "activationType": "limited",
        "keyword": "Invisible",
        "text": "Spend 1 Action and 8(bT) Ki Points to enter the Invisible Special State. You can exit the Invisible State at any time as an Instant Maneuver.",
        "usageLimit": "round",
        "maxUses": 1
      },
      {
        "level": 2,
        "activationType": "automatic",
        "keyword": "Ki Drain",
        "text": "If you are in the Invisible State due to the first effect of Camouflage, reduce your Ki Points by 6(bT) at the start of your turn."
      }
    ]
  },
  {
    "id": "bestial_claws",
    "name": "Claws",
    "category": "body",
    "description": "While some species evolved claws purely for grip while running, yours evolved them for combat. You can rend your enemy's flesh with your claws.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Slashing Unarmed",
        "text": "Your Unarmed Physical Attacks gain the benefits of the Slashing Weapon Category (this is still an Unarmed attack for all other purposes). You cannot apply an Integrated Weapon to your Physical Attacks."
      },
      {
        "level": 2,
        "activationType": "passive",
        "keyword": "Weapon Quality",
        "text": "Upon gaining this Bestial Trait, select and benefit from a Weapon Quality for your Unarmed Physical Attacks as if they were a Slashing Physical Weapon."
      },
      {
        "level": 3,
        "activationType": "triggered",
        "keyword": "Prone on Hit",
        "text": "If you hit an Opponent with your first Unarmed Physical Attack after moving into their Melee Range this Combat Round, make a Clash (Impulsive) against them. If you win, they are knocked Prone.",
        "usageLimit": "round",
        "maxUses": 1
      }
    ]
  },
  {
    "id": "bestial_extra_limbs",
    "name": "Extra Limbs",
    "category": "body",
    "description": "You have more than four limbs, allowing you to perform multiple complex actions at the same time.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Multiple Arms",
        "text": "You are in the Multiple Arms Special State."
      }
    ]
  },
  {
    "id": "bestial_fangs",
    "name": "Fangs",
    "category": "body",
    "description": "All animals must eat, but you draw your nourishment from other animals, and your teeth have evolved to prove it.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Bite Attack",
        "text": "Gain access to the Bite Attack Maneuver (see — Special Maneuvers)."
      },
      {
        "level": 2,
        "activationType": "option",
        "keyword": "Option",
        "text": "Upon gaining this Bestial Trait for the first time, choose one of the following effects:",
        "options": [
          {
            "name": "Savage",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "Increase the Wound Roll of your Bite Attack Maneuver by 3(T)."
          },
          {
            "name": "Venomous",
            "activationType": "triggered",
            "keyword": "Triggered, 2/Encounter",
            "text": "If you deal Damage to an Opponent with your Bite Attack Maneuver, make a Corporeal Clash against that Opponent. If you win, they suffer from the Poisoned Combat Condition."
          }
        ]
      }
    ]
  },
  {
    "id": "bestial_feast",
    "name": "Feast",
    "category": "body",
    "description": "You are able to sup on the life energy of others.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Absorbing Attack",
        "text": "You gain access to the Absorbing Attack Maneuver and the Drain Life Advantage."
      },
      {
        "level": 2,
        "activationType": "triggered",
        "keyword": "LP to Wound",
        "text": "When you apply the effects of the Absorbing Attack Maneuver to an Attacking Maneuver, you may reduce your Life Points by up to 3(bT) to increase the Wound Roll by twice the amount of Life Points lost."
      }
    ]
  },
  {
    "id": "bestial_impaling_horns",
    "name": "Impaling Horns",
    "category": "body",
    "description": "In combat, you charge headfirst into battle, your horns thrust forward to damage your enemies and protect you from recoil.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Charging Wound Bonus",
        "text": "Increase your Wound Rolls for your Physical Attacks with the Charging Assault Advantage by 2(T)."
      },
      {
        "level": 2,
        "activationType": "triggered",
        "keyword": "Blockade Counter",
        "text": "If an Opponent would attempt to use the Blockade Maneuver against you, make a Physical Attack through the Basic Attack Maneuver against them as an Out-of-Sequence Maneuver.",
        "usageLimit": "round",
        "maxUses": 1
      },
      {
        "level": 3,
        "activationType": "triggered",
        "keyword": "Damage Category Up",
        "text": "If you hit an Opponent with a Physical Attack that has the Charging Assault Advantage, spend 4(bT) Ki Points to increase the Damage Category by 1.",
        "usageLimit": "round",
        "maxUses": 1
      }
    ]
  },
  {
    "id": "bestial_environmental_adaptability",
    "name": "Environmental Adaptability",
    "category": "body",
    "description": "Life has a way of evolving even in the harshest of environments. Adapting to these environments has a way of permanently changing you.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "RLM Boost",
        "text": "Increase your Racial Life Modifier by 2."
      },
      {
        "level": 2,
        "activationType": "option",
        "keyword": "Option",
        "text": "Upon gaining this Bestial Trait for the first time, choose one of the following effects:",
        "options": [
          {
            "name": "Standard Environment",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "Increase your Defense Value by 1(T) while in the Standard Environment."
          },
          {
            "name": "Sky Environment",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "Increase your Defense Value by 1(T) while in the Sky Environment."
          },
          {
            "name": "Underwater Environment",
            "activationType": "passive",
            "keyword": "Passive",
            "text": "You cannot gain the Suffocating Combat Condition due to the effects of the Underwater Environment. Additionally, increase your Defense Value by 1(T) while in the Underwater Environment."
          }
        ]
      },
      {
        "level": 3,
        "activationType": "passive",
        "keyword": "Aquatic Empowerment",
        "text": "If you choose the Underwater Environment option effect of Environmental Adaptability, you may choose to: while you possess this Bestial Trait, gain the Suffocating Combat Condition at the start of each Combat Round you are not in the Underwater Environment. You lose the Suffocating Combat Condition gained this way by entering the Underwater Environment. If you choose to apply this effect, then increase your Combat Rolls by 1(T) while you are in the Underwater Environment."
      }
    ]
  },
  {
    "id": "bestial_return_to_heritage",
    "name": "Return to Heritage",
    "category": "body",
    "description": "You have the inherent ability to push away your conscious mind and act on instinct alone.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Dodge Crit Reduction",
        "text": "Reduce the Critical Target of your Dodge Rolls by 1."
      },
      {
        "level": 2,
        "activationType": "passive",
        "keyword": "Feral Fist Access",
        "text": "You have access to Feral Fist Enhancement Power."
      }
    ]
  },
  {
    "id": "bestial_tail",
    "name": "Tail",
    "category": "body",
    "description": "Born with a long, maneuverable tail, you can use this tail as an extra hand, or in some cases, as a weapon.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Tail Attack",
        "text": "Gain access to the Tail Attack Maneuver (see — Special Maneuvers)."
      },
      {
        "level": 2,
        "activationType": "passive",
        "keyword": "Strike Bonus",
        "text": "Increase the Strike Roll of your Tail Attack Maneuver by 1(T)."
      }
    ]
  },
  {
    "id": "bestial_treacherous_spikes",
    "name": "Treacherous Spikes",
    "category": "body",
    "description": "With the spines or quills emerging from your body, you defend passively against any attacks from predators or other foes.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Ranged DR",
        "text": "Increase your Damage Reduction by 2(T) against Attacking Maneuvers made from outside of your Melee Range."
      },
      {
        "level": 2,
        "activationType": "triggered",
        "keyword": "Spike Retaliation",
        "text": "When you are struck by an Unarmed Physical Attack from an Opponent on an adjacent Square to you, reduce their Life Points by 1/4 (rounded up) of your Soak Value."
      }
    ]
  },
  {
    "id": "bestial_weather_resilient",
    "name": "Weather Resilient",
    "category": "body",
    "description": "You are perfectly adapted to a specific type of weather.",
    "effects": [
      {
        "level": 1,
        "activationType": "passive",
        "keyword": "Weather Immunity",
        "text": "Select a Battle Weather. You are immune to the effects of any Weather Effects from that selected Battle Weather."
      },
      {
        "level": 2,
        "activationType": "passive",
        "keyword": "Weather Combat Bonus",
        "text": "While you are within your selected Battle Weather, increase your Combat Rolls by 1(T)."
      },
      {
        "level": 3,
        "activationType": "limited",
        "keyword": "Instant Recovery",
        "text": "If you are in your chosen Battle Weather, you may use the Combat Recovery Maneuver as an Instant Maneuver.",
        "usageLimit": "encounter",
        "maxUses": 1
      }
    ]
  }
];
