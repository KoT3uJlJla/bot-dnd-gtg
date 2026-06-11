import type { GameDomain } from "../classes/catalog.js";
import { ACT_THREE_BOSS } from "../combat/enemies.js";

export type SceneConfig = {
  key: string;
  title: string;
  publicText: string;
  challengeDomain?: GameDomain;
  threshold: number;
  enemyKey?: string;
  failureDamage: number;
};

export type ActConfig = {
  number: 1 | 2 | 3;
  title: string;
  scenes: SceneConfig[];
  scaffoldOnly?: boolean;
};

export type EventModuleConfig = {
  key: string;
  title: string;
  rewardTitle: string;
  baseReward: {
    xp: number;
    coins: number;
    eventPoints: number;
    iceShards: number;
  };
  acts: ActConfig[];
};

export const ICE_WASTELAND_EVENT: EventModuleConfig = {
  key: "ice_wasteland_assault",
  title: "Штурм ледяной пустоши",
  rewardTitle: "Победитель ледяной пустоши",
  baseReward: {
    xp: 80,
    coins: 35,
    eventPoints: 10,
    iceShards: 3
  },
  acts: [
    {
      number: 1,
      title: "Зачистка ледяной пустоши",
      scenes: [
        {
          key: "frozen_plain",
          title: "Выход на ледяную равнину",
          publicText:
            "Звено выходит на белую равнину. Под снегом хрустит старый наст, а вдалеке мерцают входы в пещеру.",
          challengeDomain: "precision",
          threshold: 5,
          failureDamage: 1
        },
        {
          key: "blizzard",
          title: "Буран",
          publicText:
            "Буран сбивает дыхание и стирает следы. Нужны воля, руны или верный проводник.",
          challengeDomain: "magic",
          threshold: 6,
          failureDamage: 2
        },
        {
          key: "ice_cracks",
          title: "Ледяные трещины",
          publicText:
            "Лед под ногами идет сеткой трещин. Один неверный шаг может утащить аватара в черную воду.",
          challengeDomain: "precision",
          threshold: 6,
          failureDamage: 2
        },
        {
          key: "ice_pack",
          title: "Стая ледяных существ",
          publicText: "Из снежной дымки вываливается стая ледяных грызунов.",
          enemyKey: "ice_rodent",
          threshold: 8,
          failureDamage: 1
        },
        {
          key: "frozen_bully",
          title: "Оледеневший Бугай",
          publicText:
            "Мини-босс ревет так, что с ближайших скал сыплется снег. Он прикрывает вход к ледяной пещере.",
          enemyKey: "frozen_bully",
          threshold: 10,
          failureDamage: 3
        }
      ]
    },
    {
      number: 2,
      title: "Штурм ледяной пещеры — вход",
      scaffoldOnly: true,
      scenes: [
        {
          key: "cave_entrance",
          title: "Вход в пещеру",
          publicText: "Скелет второго акта: разведка входа, ловушки и ледяной голем.",
          challengeDomain: "magic",
          threshold: 8,
          enemyKey: "ice_golem",
          failureDamage: 2
        }
      ]
    },
    {
      number: 3,
      title: "Штурм ледяной пещеры — босс",
      scaffoldOnly: true,
      scenes: [
        {
          key: ACT_THREE_BOSS.key,
          title: ACT_THREE_BOSS.name,
          publicText:
            "Скелет третьего акта: трехфазный босс с меняющимися уязвимостями доменов.",
          challengeDomain: "magic",
          threshold: 12,
          failureDamage: 3
        }
      ]
    }
  ]
};

export function getScene(act: number, sceneIndex: number): SceneConfig {
  const actConfig = ICE_WASTELAND_EVENT.acts.find((candidate) => candidate.number === act);
  const scene = actConfig?.scenes[sceneIndex];
  if (!scene) {
    throw new Error(`Unknown scene act=${act} sceneIndex=${sceneIndex}`);
  }

  return scene;
}

export function getNextScene(act: number, sceneIndex: number): SceneConfig | null {
  const actConfig = ICE_WASTELAND_EVENT.acts.find((candidate) => candidate.number === act);
  return actConfig?.scenes[sceneIndex + 1] ?? null;
}
