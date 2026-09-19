import { describe, expect, it } from "vitest";
import {
  checkPasswordStrength,
  generateTemporaryPassword,
  hashPassword,
  MIN_PASSWORD_LENGTH,
  verifyPassword,
} from "@/modules/auth/password";

describe("checkPasswordStrength", () => {
  it("rechaza contraseñas más cortas que el mínimo", () => {
    expect(checkPasswordStrength("Corta1")).toMatch(/al menos/);
  });

  it("exige al menos una letra", () => {
    expect(checkPasswordStrength("123456789012")).toMatch(/una letra/);
  });

  it("exige al menos un número", () => {
    expect(checkPasswordStrength("SoloLetrasAbc")).toMatch(/un número/);
  });

  it("acepta una contraseña que cumple los requisitos mínimos", () => {
    expect(checkPasswordStrength("Contrasena123")).toBeNull();
  });

  it(`admite exactamente ${MIN_PASSWORD_LENGTH} caracteres`, () => {
    const password = `Aa1${"b".repeat(MIN_PASSWORD_LENGTH - 3)}`;
    expect(password).toHaveLength(MIN_PASSWORD_LENGTH);
    expect(checkPasswordStrength(password)).toBeNull();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifica correctamente la contraseña con la que se generó el hash", async () => {
    const hash = await hashPassword("ContrasenaSintetica123");
    await expect(verifyPassword("ContrasenaSintetica123", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("ContrasenaSintetica123");
    await expect(verifyPassword("OtraContrasena456", hash)).resolves.toBe(false);
  });

  it("genera un hash distinto cada vez, incluso para la misma contraseña", async () => {
    const first = await hashPassword("ContrasenaSintetica123");
    const second = await hashPassword("ContrasenaSintetica123");
    expect(first).not.toBe(second);
  });

  it("nunca lanza ante un hash corrupto o de formato desconocido", async () => {
    await expect(verifyPassword("cualquiera", "no-es-un-hash-valido")).resolves.toBe(
      false,
    );
    await expect(verifyPassword("cualquiera", "scrypt$abc$8$1$sal$hash")).resolves.toBe(
      false,
    );
  });
});

describe("generateTemporaryPassword", () => {
  it("genera una contraseña que cumple la propia política de fortaleza", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(checkPasswordStrength(generateTemporaryPassword())).toBeNull();
    }
  });

  it("no repite el mismo valor en generaciones sucesivas", () => {
    const values = new Set(Array.from({ length: 10 }, () => generateTemporaryPassword()));
    expect(values.size).toBe(10);
  });
});
