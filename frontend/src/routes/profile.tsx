import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings - RESTORA" },
      { name: "description", content: "Manage your restaurant details, preferences, and account." },
      { property: "og:title", content: "Profile & Settings - RESTORA" },
      { property: "og:description", content: "Manage your restaurant details, preferences, and account." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <AppShell active="/profile">
      <div className="mb-lg">
        <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">Profile &amp; Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your restaurant details, preferences, and account.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        {/* Restaurant Profile */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant sillar-shadow">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Restaurant Profile</h3>
            <button className="text-primary hover:bg-surface-container px-3 py-1 rounded-full transition-colors font-label-md text-label-md">Edit</button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-lg mb-lg">
            <div className="w-24 h-24 rounded-lg bg-surface-variant flex-shrink-0 relative overflow-hidden group cursor-pointer border border-outline-variant">
              <img
                className="w-full h-full object-cover"
                alt="Arequipa Central restaurant logo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcUAGmKeMQ8b7bmLedGORr-UGN9VtjHw9AtD6r1mfP1TS8EkLc57ztz8mYW1TaPfq0dDJLlsjfb9fjQh1nrUnz-QwqpZKPAacqfUAvamQxRNDAU3DEnOqXLegMcAbndR6pTqQzAYPwJDsQxLdhot0auaZNAKvWyBf2pr3jdj--pGCNclIswvb808suyvMmqRNtn0H6cWzYDPb87UVnh2h3C_be6WGzCa2an4wssIARjQBs-pn0hERtrQ"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Restaurant Name</label>
                <input className="w-full h-[48px] px-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface" readOnly type="text" defaultValue="Arequipa Central" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Location</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">location_on</span>
                <input className="w-full h-[48px] pl-10 pr-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface" readOnly type="text" defaultValue="Plaza de Armas, Arequipa" />
              </div>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Contact Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input className="w-full h-[48px] pl-10 pr-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface" readOnly type="email" defaultValue="admin@arequipacentral.pe" />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="md:col-span-4 bg-primary-container text-on-primary-container rounded-xl p-lg flex flex-col justify-between relative overflow-hidden sillar-shadow">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-sm relative z-10">
              <span className="font-label-md text-label-md uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">Active Plan</span>
              <span className="material-symbols-outlined" data-weight="fill">verified</span>
            </div>
            <h3 className="font-display-lg-mobile text-display-lg-mobile font-bold mb-xs relative z-10">Premium AI</h3>
            <p className="font-body-md text-body-md opacity-90 relative z-10">Full access to advanced analytics, automated registry, and priority support.</p>
          </div>
          <div className="mt-lg relative z-10 border-t border-white/20 pt-md">
            <div className="flex justify-between items-center mb-sm">
              <span className="font-label-sm text-label-sm">Next Billing</span>
              <span className="font-label-md text-label-md font-semibold">Oct 15, 2024</span>
            </div>
            <button className="w-full h-[48px] bg-surface-container-lowest text-primary rounded-lg font-label-md text-label-md font-bold hover:bg-surface-variant transition-colors mt-2">Manage Subscription</button>
          </div>
        </div>

        {/* Preferences */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl p-0 border border-outline-variant overflow-hidden sillar-shadow">
          <div className="p-lg border-b border-outline-variant bg-surface-container-low">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">App Preferences</h3>
          </div>
          <ul className="divide-y divide-outline-variant">
            <li className="flex items-center justify-between p-md hover:bg-surface-container transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mr-md text-on-surface-variant">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface font-medium">Push Notifications</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Alerts for new registrations and reports.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={pushNotifications}
                  onChange={() => setPushNotifications((v) => !v)}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </li>
            <li className="flex items-center justify-between p-md hover:bg-surface-container transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mr-md text-on-surface-variant">
                  <span className="material-symbols-outlined">language</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface font-medium">Language</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">App display language.</p>
                </div>
              </div>
              <div className="flex items-center text-on-surface-variant cursor-pointer group">
                <span className="font-body-md text-body-md mr-1 group-hover:text-primary">English</span>
                <span className="material-symbols-outlined text-[20px] group-hover:text-primary">chevron_right</span>
              </div>
            </li>
            <li className="flex items-center justify-between p-md hover:bg-surface-container transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mr-md text-on-surface-variant">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface font-medium">Theme</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Light, Dark, or System default.</p>
                </div>
              </div>
              <div className="flex items-center text-on-surface-variant cursor-pointer group">
                <span className="font-body-md text-body-md mr-1 group-hover:text-primary">Light Mode</span>
                <span className="material-symbols-outlined text-[20px] group-hover:text-primary">chevron_right</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-12 mt-md">
          <button className="w-full md:w-auto h-[48px] px-lg rounded-lg border border-error text-error hover:bg-error-container hover:text-on-error-container transition-colors font-label-md text-label-md font-bold flex items-center justify-center">
            <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
