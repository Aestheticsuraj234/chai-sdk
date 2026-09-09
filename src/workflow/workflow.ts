export function workflow(config: {
    name: string;
    steps: { input: string; tool?: string }[];
  }) {
    return config;
  }
  