// Backend candidate endpoints prioritized for IPv4 stability
const CANDIDATES = [
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8000'
].filter((v, i, a) => v && a.indexOf(v) === i);

let activeBaseUrl = CANDIDATES[0];

async function request(endpoint, options = {}) {
  const urlsToTry = [activeBaseUrl, ...CANDIDATES.filter(u => u !== activeBaseUrl)];
  let lastError = null;

  for (const base of urlsToTry) {
    const fullUrl = `${base}${endpoint}`;
    try {
      const res = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error(`Backend server unavailable (${res.status} ${res.statusText}). Please ensure the FastAPI server is running with start_backend.bat.`);
        }

        let errorMsg = `Server error: ${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) {
            errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch (e) {
          // fallback to status text
        }
        throw new Error(errorMsg);
      }

      // Success - retain active working base URL
      activeBaseUrl = base;
      return await res.json();
    } catch (err) {
      lastError = err;
      // If network failure / connection refused, test the next candidate
      if (err.name === 'TypeError' && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Unable to reach the ML backend at ${activeBaseUrl}. Please ensure the FastAPI server is running (run start_backend.bat).`);
}

export const api = {
  getBaseUrl: () => activeBaseUrl,

  checkHealth: async () => {
    return await request('/health');
  },

  getFeatures: async () => {
    return await request('/features');
  },

  predictSoc: async (features) => {
    return await request('/predict/soc', {
      method: 'POST',
      body: JSON.stringify(features)
    });
  },

  predictSoh: async (features) => {
    return await request('/predict/soh', {
      method: 'POST',
      body: JSON.stringify(features)
    });
  },

  predictRul: async (features) => {
    return await request('/predict/rul', {
      method: 'POST',
      body: JSON.stringify(features)
    });
  },

  predictAll: async (features) => {
    return await request('/predict/all', {
      method: 'POST',
      body: JSON.stringify(features)
    });
  },

  optimizeCharging: async (params) => {
    try {
      return await request('/charging/optimize', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    } catch (err) {
      // Client-side fallback if backend is offline so the Smart Charging page stays fully functional
      console.warn("Backend unavailable for /charging/optimize, using client-side calculation:", err.message);
      return calculateClientCharging(params);
    }
  },

  getAnalyticsSummary: async () => {
    return await request('/analytics/summary');
  }
};

/**
 * Client-side fallback calculation matching the backend's exact mathematics
 */
export function calculateClientCharging(params) {
  const {
    current_charge_pct = 20,
    desired_charge_pct = 80,
    battery_capacity_kwh = 50,
    charger_power_kw = 7.4,
    tariff_inr_per_kwh = 8.5,
    charging_efficiency_pct = 90.0,
    available_time_hours = 8.0
  } = params;

  const delta_pct = Math.max(0, desired_charge_pct - current_charge_pct);
  const energy_stored_kwh = battery_capacity_kwh * (delta_pct / 100.0);
  const efficiency_fraction = charging_efficiency_pct / 100.0;
  const energy_grid_kwh = energy_stored_kwh / efficiency_fraction;
  const effective_power_kw = charger_power_kw * efficiency_fraction;
  const estimated_time_hours = effective_power_kw > 0 ? (energy_stored_kwh / effective_power_kw) : 0;
  const estimated_cost_inr = energy_grid_kwh * tariff_inr_per_kwh;
  const is_feasible = estimated_time_hours <= available_time_hours;
  const time_margin_hours = available_time_hours - estimated_time_hours;
  const min_power_kw = (available_time_hours > 0 && efficiency_fraction > 0)
    ? (energy_stored_kwh / (available_time_hours * efficiency_fraction))
    : charger_power_kw;

  const hours_int = Math.floor(estimated_time_hours);
  const minutes_int = Math.round((estimated_time_hours - hours_int) * 60);

  const schedule_steps = [];
  if (desired_charge_pct > 80 && current_charge_pct < 80) {
    const bulk_delta = 80 - current_charge_pct;
    const bulk_energy = battery_capacity_kwh * (bulk_delta / 100.0);
    const bulk_time = bulk_energy / effective_power_kw;
    schedule_steps.push({
      phase: "Bulk Constant Current Phase",
      soc_range: `${current_charge_pct.toFixed(0)}% to 80%`,
      energy_kwh: +(bulk_energy.toFixed(2)),
      estimated_hours: +(bulk_time.toFixed(2)),
      recommendation: "Full rated charger power utilized with constant current."
    });
    const taper_delta = desired_charge_pct - 80;
    const taper_energy = battery_capacity_kwh * (taper_delta / 100.0);
    const taper_time = (taper_energy / effective_power_kw) * 1.3;
    schedule_steps.push({
      phase: "Tapered Absorption Phase",
      soc_range: `80% to ${desired_charge_pct.toFixed(0)}%`,
      energy_kwh: +(taper_energy.toFixed(2)),
      estimated_hours: +(taper_time.toFixed(2)),
      recommendation: "Current gradually tapers to preserve cell voltage limits and prevent overheating."
    });
  } else {
    schedule_steps.push({
      phase: "Standard Constant Rate Phase",
      soc_range: `${current_charge_pct.toFixed(0)}% to ${desired_charge_pct.toFixed(0)}%`,
      energy_kwh: +(energy_stored_kwh.toFixed(2)),
      estimated_hours: +(estimated_time_hours.toFixed(2)),
      recommendation: "Maintain steady charging under monitored thermal boundaries."
    });
  }

  return {
    status: "success",
    inputs: {
      current_soc_pct: current_charge_pct,
      desired_soc_pct: desired_charge_pct,
      battery_capacity_kwh,
      charger_power_kw,
      tariff_inr_per_kwh,
      charging_efficiency_pct,
      available_time_hours
    },
    results: {
      energy_stored_kwh: +(energy_stored_kwh.toFixed(2)),
      energy_grid_consumed_kwh: +(energy_grid_kwh.toFixed(2)),
      estimated_time_hours: +(estimated_time_hours.toFixed(2)),
      formatted_time: hours_int > 0 ? `${hours_int} hr ${minutes_int} min` : `${minutes_int} min`,
      estimated_cost_inr: +(estimated_cost_inr.toFixed(2)),
      is_feasible,
      time_margin_hours: +(time_margin_hours.toFixed(2)),
      min_required_charger_kw: +(min_power_kw.toFixed(2))
    },
    schedule: schedule_steps,
    assumptions: [
      `Charging efficiency assumption: ${charging_efficiency_pct.toFixed(1)}% grid-to-battery energy conversion.`,
      "Electricity pricing calculated at flat rate without Time-of-Day (ToD) penalties.",
      "Cell thermal throttling assumed within safe operational range (ambient 25°C-35°C)."
    ]
  };
}
