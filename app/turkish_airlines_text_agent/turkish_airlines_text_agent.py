# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import google.auth
from google.adk.agents.llm_agent import LlmAgent
from google.adk.planners import BuiltInPlanner
from google.genai.types import ThinkingConfig

_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

phone_number = "05551234567"  # Default phone number for Ugur Akın Eren
customer = None  # Global variable to store customer data after phone number is provided

SYSTEM_INSTRUCTION ="""
You are a friendly and highly knowledgeable airline call center agent for TURKISH AIRLINES. Your goal is to help users with all aspects of their flight reservations and travel needs.
Introduce yourself as Alex from the TURKISH AIRLINES support team.

LANGUAGE DETECTION AND RESPONSE:
- CRITICAL: Detect the user's language from their first message and respond EXCLUSIVELY in that language throughout the entire conversation
- Turkish speakers: Respond in Turkish only
- English speakers: Respond in English only  
- Other languages: Respond in the language the user uses
- NEVER mix languages in a single response unless specifically asked for translation

IMPORTANT: NEVER mention tools, function calls, or system actions in your responses. Keep all interactions natural and conversational.

WORKFLOW:
1. First greeting: 
   - Turkish users: "Merhaba! Ben TÜRK HAVA YOLLARI destek ekibinden Alex. Size nasıl yardımcı olabilirim? Aradığınız numara üzerinden mi işlem yapmak istiyorsunuz?"
   - English users: "Hello! I'm Alex from TURKISH AIRLINES support team. How can I assist you today? Would you like to proceed with the phone number you're calling from?"

2. Phone number handling:
   - Turkish: "Evet" (Yes) / "Hayır" (No) responses
   - English: "Yes" / "No" responses
   - If "Evet/Yes": Use ONLY "05551234567" for Ugur Akın Eren
   - If "Hayır/No": Ask for their preferred number in their language
   - If customer provides a number: Use EXACTLY what they provide (e.g., "05559876543" for Gizem Kaya)
   - If number not found: 
     * Turkish: "Bu numara sistemimizde kayıtlı değil. Başka bir numara denemek ister misiniz?"
     * English: "This number is not registered in our system. Would you like to try another number?"
   - CRITICAL: Store and use this SAME phone number for ALL subsequent tool calls

3. Customer verification:
   - Turkish: Greet using "Sayın" before their first name, ask "Kimlik numaranızın son beş hanesini veya pasaport numaranızın son beş hanesini söyler misiniz?"
   - English: Greet using "Mr./Ms." or "Dear", ask "Could you please provide the last five digits of your ID or passport number?"
   - Verify using stored phone number AND provided digits
   - After verification, continue using the respectful address format in their language

4. Flight information:
   - Access flights using SAME stored phone number 
   - Present ONLY the EXACT flight details from get_customer_flights
   - For one flight: Present details and ask if they want to process it (in their language)
   - For multiple flights: List options with EXACT details and ask which to handle (in their language)
   - NEVER invent or generate flight information not in CUSTOMER_DATA

CULTURAL RESPECT:
- Turkish: Use "Sayın" + first name (or second part of compound first name), formal addressing
- English: Use "Mr./Ms." + last name or "Dear" + first name, professional tone
- Maintain appropriate cultural courtesy throughout the conversation

GOLDEN RULES:
- Respond ONLY in the user's detected language
- Keep interactions natural and conversational
- Maintain consistent customer context throughout the call
- Use EXACT same phone number for ALL tool calls
- Present ONLY flight information that exists in CUSTOMER_DATA
- NEVER reveal technical implementation details to customers

For all customer service scenarios (changes, cancellations, baggage, upgrades), maintain the same precise approach - use the exact stored phone number, present only actual flight details, and provide clear, polite guidance in the user's language.
"""


# Customer data model for the dummy customer
CUSTOMER_DATA = {
    "05551234567": {  # Phone number
        "name": "Ugur Akın Eren",
        "phone_number": "05551234567",
        "identity_number": "12345678912",  # TC Kimlik No (national ID)
        "passport": "P1234567",      # Passport number
        "flights": [
            {
                "flight_number": "TK1984",
                "ticket_number": "235-1234567890",
                "origin": "IST",
                "destination": "JFK",
                "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "departure_time": "14:30",
                "arrival_time": "18:45",
                "status": "confirmed",
                "class": "economy",
                "seat": "23A",
                "baggage_allowance": "30kg"
            },
            {
                "flight_number": "TK2023",
                "ticket_number": "235-9876543210",
                "origin": "JFK",
                "destination": "IST",
                "date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
                "departure_time": "20:15",
                "arrival_time": "14:30",
                "status": "confirmed",
                "class": "economy",
                "seat": "18C",
                "baggage_allowance": "30kg"
            }
        ]
    },
    "05559876543": {  # Additional phone number for testing
        "name": "Gizem Kaya",
        "phone_number": "05559876543",
        "identity_number": "98765432109",  # TC Kimlik No (national ID)
        "passport": "P7654321",      # Passport number
        "flights": [
            {
                "flight_number": "TK2468",
                "ticket_number": "235-2468101214",
                "origin": "IST",
                "destination": "LHR",
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "departure_time": "09:45",
                "arrival_time": "11:55",
                "status": "confirmed",
                "class": "business",
                "seat": "4A",
                "baggage_allowance": "40kg"
            }
        ]
    }
}

# Customer data functions
def get_customer_by_phone(phone_number):
    """
    Retrieve customer data based on phone number.
    Args:
        phone_number: Customer's phone number.
    Returns:
        dict: Customer data or None if not found.
    """
    # phone_number = phone_number or "05551234567"
    return CUSTOMER_DATA.get(phone_number)

def validate_id_or_passport(customer_data, id_last_5_digits):
    """
    Validate the last 5 digits of ID or passport number.
    Args:
        customer_data: The customer data dictionary.
        id_last_5_digits: Last 5 digits provided by the customer.
    Returns:
        bool: True if valid, False otherwise.
    """

    # Ensure id_last_5_digits is a string and remove any whitespace
    id_last_5_digits = str(id_last_5_digits).strip()
    
    # Check if identity_number exists before accessing it
    id_last_5 = customer_data.get("identity_number")[-5:] if customer_data.get("identity_number") else ""
    
    # Check if passport exists before accessing it
    passport_last_5 = customer_data.get("passport")[-5:] if customer_data.get("passport") else ""
    
    # Check if the last 5 digits match identity number
    if id_last_5 and id_last_5 == id_last_5_digits:
        return True
    
    # Check if the last 5 digits match passport
    if passport_last_5 and passport_last_5 == id_last_5_digits:
        return True
    
    return False

def get_customer_flights(customer_data):
    """
    Get the list of flights for a customer.
    Args:
        customer_data: The customer data dictionary.
    Returns:
        list: List of flights or empty list if none found.
    """
    return customer_data.get("flights", [])


def get_customer_info_tool(phone_number: str):
    """
    Retrieve customer data based on phone number.
    Args:
        phone_number: Customer's phone number.
    Returns:
        dict: Customer information or error message.
    """
    print(f"Debug: Received phone number: {phone_number}")
    customer = get_customer_by_phone(phone_number)
    if not customer:
        return {
            "status": "not_found",
            "message": "Customer not found with this phone number."
        }
    
    return {
        "status": "found",
        "message": f"Customer {customer['name']} found.",
        "phone_number": customer.get("phone_number"),
        "identity_number": customer.get("identity_number"),
        "passport": customer.get("passport"),
        "flight_count": len(customer.get("flights", [])),
        "flights": customer.get("flights", [])
    }


def verify_id_tool(phone_number: str, id_last_5_digits: str):
    """
    Verify customer identity using phone number and last 5 digits of ID/passport.
    Args:
        phone_number: Customer's phone number.
        id_last_5_digits: Last 5 digits of ID or passport number.
    Returns:
        dict: Verification result.
    """
    customer = get_customer_by_phone(phone_number)
    
    if not customer:
        return {
            "status": "not_found",
            "message": "Customer not found with this phone number."
        }
    
    is_valid = validate_id_or_passport(customer, id_last_5_digits)
    return {
        "status": "verified" if is_valid else "invalid",
        "name": customer["name"],
        "message": "ID verification successful." if is_valid else "Invalid ID or passport number."
    }


def get_customer_flights_tool(phone_number: str):
    """
    Get the list of flights for a customer by phone number.
    Args:
        phone_number: Customer's phone number.
    Returns:
        dict: Flight information for the customer.
    """
    customer = get_customer_by_phone(phone_number)
    
    if not customer:
        return {
            "status": "not_found",
            "message": "Customer not found with this phone number."
        }
    
    flights = get_customer_flights(customer)
    return {
        "status": "success",
        "name": customer["name"],
        "flights": flights,
        "flight_count": len(flights),
        "message": f"Found {len(flights)} flights for {customer['name']}."
    }


def change_flight_tool(ticket_number: str, new_time: str, origin: str, destination: str, date: str, direct_only: bool = False):
    """
    Change flight and get alternative options.
    Args:
        ticket_number: The ticket number to change.
        new_time: Requested new departure time.
        origin: Origin airport code.
        destination: Destination airport code.
        date: Travel date.
        direct_only: Whether to show only direct flights.
    Returns:
        dict: Flight change options.
    """
    # Simple heuristic: include at least one direct (if available) and two transfer options
    alternatives = []

    # Example direct option (only include if not forcing transfers)
    if not direct_only:
        alternatives.append(
            {
                "flight_number": "TK234",
                "segments": [{"from": origin, "to": destination}],
                "departure": f"{date} 16:00",
                "arrival": f"{date} 18:30",
                "stops": 0,
                "total_travel_time": "2h 30m",
                "price_difference": 350,
                "estimated_total_price": 1200 + 350,
                "seats_available": 5,
                "meal_service": "Included",
                "direct": True,
                "message": "Direct flight available."
            }
        )

    # First connecting option (single transfer)
    alternatives.append(
        {
            "flight_number": "TK567",
            "segments": [
                {"from": origin, "to": "FRA", "departure": f"{date} 09:00", "arrival": f"{date} 11:00"},
                {"from": "FRA", "to": destination, "departure": f"{date} 14:00", "arrival": f"{date} 18:30"},
            ],
            "departure": f"{date} 09:00",
            "arrival": f"{date} 18:30",
            "stops": 1,
            "transfer_airports": ["FRA"],
            "layover_times": ["3h"],
            "total_travel_time": "9h 30m",
            "price_difference": 250,
            "estimated_total_price": 1200 + 250,
            "seats_available": 2,
            "meal_service": "Included",
            "direct": False,
            "message": "Transfer at Frankfurt (FRA). Reasonable layover for connection."
        }
    )

    # Second connecting option (single transfer, later arrival)
    alternatives.append(
        {
            "flight_number": "TK890",
            "segments": [
                {"from": origin, "to": "LHR", "departure": f"{date} 12:00", "arrival": f"{date} 14:00"},
                {"from": "LHR", "to": destination, "departure": f"{date} 16:00", "arrival": f"{date} 20:30"},
            ],
            "departure": f"{date} 12:00",
            "arrival": f"{date} 20:30",
            "stops": 1,
            "transfer_airports": ["LHR"],
            "layover_times": ["2h"],
            "total_travel_time": "8h 30m",
            "price_difference": 150,
            "estimated_total_price": 1200 + 150,
            "seats_available": 8,
            "meal_service": "Not included",
            "direct": False,
            "message": "Transfer at London Heathrow (LHR). Shorter total travel time but later arrival."
        }
    )

    # If the user explicitly requested direct_only but none exist, return helpful message
    if direct_only and all(a.get("direct") is False for a in alternatives):
        return {
            "ticket_number": ticket_number,
            "status": "No direct flights available",
            "origin": origin,
            "destination": destination,
            "date": date,
            "alternatives": alternatives,
            "info": "No direct flights were found for the requested time. Showing connecting options instead."
        }

    return {
        "ticket_number": ticket_number,
        "status": "Flight change options",
        "requested_new_time": new_time,
        "origin": origin,
        "destination": destination,
        "date": date,
        "alternatives": alternatives,
        "info": "Below are your alternative flights including transfer airports, layover times, seat availability and estimated total price."
    }


def cancel_flight_tool(ticket_number: str):
    """
    Cancel a flight and calculate fees/refunds.
    Args:
        ticket_number: The ticket number to cancel.
    Returns:
        dict: Cancellation details.
    """
    cancellation_fee = 500
    refund_amount = 1200
    return {
        "ticket_number": ticket_number,
        "status": "Cancelled",
        "cancellation_fee": cancellation_fee,
        "refund_amount": refund_amount,
        "message": f"Your flight has been cancelled. Cancellation fee: {cancellation_fee} USD. Refund amount: {refund_amount} USD."
    }


def open_ticket_tool(ticket_number: str):
    """
    Convert ticket to open ticket.
    Args:
        ticket_number: The ticket number to open.
    Returns:
        dict: Open ticket details.
    """
    open_ticket_fee = 200
    validity_period = "1 year"
    return {
        "ticket_number": ticket_number,
        "status": "Open",
        "open_ticket_fee": open_ticket_fee,
        "validity_period": validity_period,
        "message": f"Your ticket is now open. Fee: {open_ticket_fee} USD. Valid for {validity_period}."
    }


def calculate_fee_tool(ticket_number: str, operation: str):
    """
    Calculate fees for various operations.
    Args:
        ticket_number: The ticket number.
        operation: Type of operation ('change', 'cancel', 'upgrade', etc.).
    Returns:
        dict: Fee calculation details.
    """
    base_fee = 1000
    taxes = 120
    service_charge = 50
    if operation == "change":
        fee = base_fee + 350 + taxes + service_charge
    elif operation == "cancel":
        fee = base_fee - 500 + taxes
    elif operation == "upgrade":
        fee = base_fee + 800 + taxes + service_charge
    else:
        fee = base_fee + taxes
    return {
        "ticket_number": ticket_number,
        "operation": operation,
        "calculated_fee": fee,
        "breakdown": {
            "base_fee": base_fee,
            "taxes": taxes,
            "service_charge": service_charge
        },
        "message": f"Calculated fee for {operation}: {fee} USD."
    }


def transfer_support_tool(ticket_number: str):
    """
    Get transfer and connection information.
    Args:
        ticket_number: The ticket number.
    Returns:
        dict: Transfer information.
    """
    transfer_info = {
        "segments": [
            {"from": "IST", "to": "FRA", "departure": "2025-09-14 09:00"},
            {"from": "FRA", "to": "JFK", "departure": "2025-09-14 13:00"},
        ],
        "total_travel_time": "14h 30m",
        "layover_time": "4h",
        "transfer_airport": "Frankfurt (FRA)",
        "message": "Your connecting flights and transfer details are provided."
    }
    return {
        "ticket_number": ticket_number,
        "status": "Transfer Info",
        **transfer_info
    }


def suggest_alternatives_tool(origin: str, destination: str, date: str):
    """
    Suggest alternative flights for a route and date.
    Args:
        origin: Origin airport code.
        destination: Destination airport code.
        date: Travel date.
    Returns:
        dict: Alternative flight options.
    """
    # Example alternative flights
    alternatives = [
        {
            "flight_number": "TK234",
            "departure": f"{date} 16:00",
            "arrival": f"{date} 18:30",
            "price": 1200,
            "direct": True,
            "seats_available": 5,
            "meal_service": "Included"
        },
        {
            "flight_number": "TK567",
            "departure": f"{date} 19:00",
            "arrival": f"{date} 22:30",
            "price": 1100,
            "direct": False,
            "transfer": "FRA",
            "seats_available": 2,
            "meal_service": "Included"
        },
        {
            "flight_number": "TK890",
            "departure": f"{date} 21:00",
            "arrival": f"{date} 01:30",
            "price": 950,
            "direct": False,
            "transfer": "LHR",
            "seats_available": 8,
            "meal_service": "Not included"
        }
    ]
    return {
        "origin": origin,
        "destination": destination,
        "date": date,
        "alternatives": alternatives,
        "message": "Here are alternative flight options with seat availability and meal service details."
    }


def baggage_info_tool(ticket_number: str):
    """
    Get baggage allowance and fee information.
    Args:
        ticket_number: The ticket number.
    Returns:
        dict: Baggage information.
    """
    baggage_allowance = "30kg checked, 8kg cabin"
    excess_fee = 25
    return {
        "ticket_number": ticket_number,
        "baggage_allowance": baggage_allowance,
        "excess_fee_per_kg": excess_fee,
        "message": f"Baggage allowance: {baggage_allowance}. Excess baggage fee: {excess_fee} USD per kg."
    }


def upgrade_request_tool(ticket_number: str):
    """
    Request seat or class upgrade.
    Args:
        ticket_number: The ticket number.
    Returns:
        dict: Upgrade information.
    """
    upgrade_fee = 800
    available_classes = ["Business", "First"]
    return {
        "ticket_number": ticket_number,
        "upgrade_fee": upgrade_fee,
        "available_classes": available_classes,
        "message": f"Upgrade available to {', '.join(available_classes)}. Fee: {upgrade_fee} USD."
    }


def special_assistance_tool(ticket_number: str):
    """
    Request special assistance services.
    Args:
        ticket_number: The ticket number.
    Returns:
        dict: Special assistance information.
    """
    assistance_types = ["Wheelchair", "Special meal", "Unaccompanied minor"]
    contact_number = "+1-800-555-1234"
    return {
        "ticket_number": ticket_number,
        "assistance_types": assistance_types,
        "contact_number": contact_number,
        "message": "Special assistance options are available. Please contact support for arrangements."
    }


root_agent = LlmAgent(
    name="root_agent",
    model="gemini-2.5-flash",
    instruction=SYSTEM_INSTRUCTION,
    tools=[
        get_customer_info_tool,
        verify_id_tool,
        get_customer_flights_tool,
        change_flight_tool,
        cancel_flight_tool,
        open_ticket_tool,
        calculate_fee_tool,
        transfer_support_tool,
        suggest_alternatives_tool,
        baggage_info_tool,
        upgrade_request_tool,
        special_assistance_tool
    ],
)